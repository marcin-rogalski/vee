import type ChatContextManagerPort from "@application/ports/ChatContextManager.port";
import type ChatToolManagerPort from "@application/ports/ChatToolManager.port";
import type ModelPort from "@application/ports/Model.port";
import ChatMessageUseCase from "@application/usecases/ChatMessage.usecase";
import z from "zod";
import Endpoint from "../server/endpoint";

const schemas = {
	params: z.object({ session: z.string() }),
	body: z.object({ message: z.string() }),
	sse: z.discriminatedUnion("type", [
		z.object({
			type: z.literal("token"),
			data: z.object({ content: z.string() }),
		}),
		z.object({
			type: z.literal("thought"),
			data: z.object({ content: z.string() }),
		}),
		z.object({
			type: z.literal("tool-call"),
			data: z.object({
				id: z.string(),
				name: z.string(),
				arguments: z.record(z.string(), z.unknown()),
			}),
		}),
		z.object({
			type: z.literal("tool-response"),
			data: z.object({ toolCallId: z.string(), result: z.string() }),
		}),
		z.object({ type: z.literal("done") }),
		z.object({ type: z.literal("error"), error: z.unknown().optional() }),
	]),
};

class UserMessageEndpoint extends Endpoint.typed(
	"POST",
	"/{session:string}/message",
	schemas,
) {
	private readonly useCase: ChatMessageUseCase;

	constructor(
		contextManager: ChatContextManagerPort,
		toolManager: ChatToolManagerPort,
		private readonly model: ModelPort,
	) {
		super();
		this.useCase = new ChatMessageUseCase(contextManager, toolManager);
	}

	handle(params: { session: string }, body: { message: string }) {
		return this.useCase.execute(params.session, body.message, this.model);
	}
}

export default UserMessageEndpoint;
