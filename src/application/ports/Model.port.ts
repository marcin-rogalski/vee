import type ChatEntry from "@application/dto/ChatEntry.dto";
import type ChatEvent from "@application/dto/ChatEvent.dto";
import type { ToolDefinition } from "@application/ports/ChatToolManager.port";

interface ModelPort {
	streamResponse(
		context: ChatEntry[],
		tools: ToolDefinition[],
	): AsyncGenerator<Exclude<ChatEvent, { type: "tool-response" }>>;
}

export default ModelPort;
