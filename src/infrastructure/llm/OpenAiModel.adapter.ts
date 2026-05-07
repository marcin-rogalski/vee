import type ChatEntry from "@application/dto/ChatEntry.dto";
import type ChatEvent from "@application/dto/ChatEvent.dto";
import type { ToolDefinition } from "@application/ports/ChatToolManager.port";
import type ModelPort from "@application/ports/Model.port";
import OpenAI from "openai";

class OpenAiModelAdapter implements ModelPort {
	private client: OpenAI;

	constructor(
		private url: string,
		private apiKey: string,
		private model: string,
	) {
		this.client = new OpenAI({ baseURL: this.url, apiKey: this.apiKey });
	}

	async *streamResponse(
		context: ChatEntry[],
		tools: ToolDefinition[],
	): AsyncGenerator<Exclude<ChatEvent, { type: "tool-response" }>> {
		const stream = this.client.chat.completions.stream({
			model: this.model,
			tools: tools.map((tool) => ({ type: "function", function: tool })),
			messages: toOpenAiMessages(context),
			stream: true,
		});

		const pendingToolCalls: Record<
			number,
			{ id: string; name: string; arguments: string }
		> = {};

		for await (const part of stream) {
			const delta = part.choices[0]?.delta;

			if (delta?.content) {
				yield { type: "token", data: { content: delta.content } };
			}

			for (const tc of delta?.tool_calls ?? []) {
				if (!pendingToolCalls[tc.index]) {
					pendingToolCalls[tc.index] = {
						id: tc.id ?? "",
						name: tc.function?.name ?? "",
						arguments: "",
					};
				}

				const pending = pendingToolCalls[tc.index];
				if (pending) {
					pending.arguments += tc.function?.arguments ?? "";
				}
			}

			if (part.choices[0]?.finish_reason === "stop") {
				yield { type: "done" };
			}
		}

		for (const { id, name, arguments: args } of Object.values(
			pendingToolCalls,
		)) {
			yield {
				type: "tool-call",
				data: { id, name, arguments: JSON.parse(args || "{}") },
			};
		}
	}
}

export default OpenAiModelAdapter;

function toOpenAiMessages(
	context: ChatEntry[],
): OpenAI.ChatCompletionMessageParam[] {
	const messages: OpenAI.ChatCompletionMessageParam[] = [];
	let i = 0;

	while (i < context.length) {
		const entry = context[i] as ChatEntry;
		if (entry.author === "tool-call") {
			const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];
			while (
				i < context.length &&
				(context[i] as ChatEntry).author === "tool-call"
			) {
				const tc = context[i] as Extract<ChatEntry, { author: "tool-call" }>;
				toolCalls.push({
					id: tc.id,
					type: "function",
					function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
				});
				i++;
			}
			messages.push({
				role: "assistant",
				content: null,
				tool_calls: toolCalls,
			});
		} else if (entry.author === "tool-result") {
			messages.push({
				role: "tool",
				tool_call_id: entry.id,
				content: entry.result,
			});
			i++;
		} else {
			messages.push({ role: entry.author, content: entry.content });
			i++;
		}
	}
	return messages;
}
