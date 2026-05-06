import type ChatEvent from "@application/dto/ChatEvent.dto";
import type ChatContextManagerPort from "@application/ports/ChatContextManager.port";
import type ChatToolManagerPort from "@application/ports/ChatToolManager.port";
import type LoggerPort from "@application/ports/Logger.port";
import type ModelPort from "@application/ports/Model.port";

class ChatMessageUseCase {
	constructor(
		readonly contextManager: ChatContextManagerPort,
		readonly toolManager: ChatToolManagerPort,
		readonly logger: LoggerPort,
	) {}

	async *execute(
		sessionId: string,
		prompt: string,
		model: ModelPort | null,
	): AsyncGenerator<ChatEvent> {
		if (!model) {
			throw new Error("No active model configured");
		}
		const tools = await this.toolManager.getTools();
		const context = await this.contextManager.getContext(sessionId);

		context.startTurn(prompt);

		let done = false;
		while (!done) {
			let chunkText = "";
			const toolCalls: PendingToolCall[] = [];
			for await (const event of model.streamResponse(context.entries, tools)) {
				yield event;

				if (event.type === "token") {
					chunkText += event.data.content;
				}

				if (event.type === "tool-call") {
					toolCalls.push({
						id: event.data.id,
						toolName: event.data.name,
						toolArguments: event.data.arguments,
						ts: Date.now(),
					});
				}
			}

			if (chunkText) {
				await context.push({
					author: "assistant",
					content: chunkText,
					ts: Date.now(),
				});
			}

			if (toolCalls.length) {
				await context.push(
					...toolCalls.map(({ id, toolName, toolArguments, ts }) => ({
						author: "tool-call" as const,
						id,
						name: toolName,
						arguments: toolArguments,
						ts,
					})),
				);

				for (const { id, toolName, toolArguments } of toolCalls) {
					const toolResult = await this.toolManager.executeTool(
						toolName,
						toolArguments,
					);

					yield {
						type: "tool-response",
						data: { toolCallId: id, result: toolResult },
					};
					await context.push({
						author: "tool-result",
						id,
						result: toolResult,
						ts: Date.now(),
					});
				}
			} else {
				done = true;
			}
		}

		const stats = context.getStats();
		context.commitTurn();
		this.logger.info("chat.turn", {
			...stats,
			tokens: `${stats.tokenUsage} (${stats.tokenPct})`,
		});
	}
}

export default ChatMessageUseCase;

type PendingToolCall = {
	id: string;
	toolName: string;
	toolArguments: Record<string, unknown>;
	ts: number;
};
