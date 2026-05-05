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
			messages: context.map((entry) => {
				if (entry.author === "tool-call") {
					// todo: fold into the preceding assistant message as tool_calls[]
					return { role: "assistant" as const, content: "" };
				}

				if (entry.author === "tool-result") {
					return {
						role: "tool" as const,
						tool_call_id: entry.id,
						content: entry.result,
					};
				}

				return { role: entry.author, content: entry.content };
			}),
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
