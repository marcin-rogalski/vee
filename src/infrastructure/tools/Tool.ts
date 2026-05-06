import type { ToolDefinition } from "@application/ports/ChatToolManager.port";

abstract class Tool {
	abstract readonly definition: ToolDefinition;
	abstract execute(args: Record<string, unknown>): Promise<string>;
}

export default Tool;
