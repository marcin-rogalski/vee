import type ChatToolManagerPort from "@application/ports/ChatToolManager.port";
import type { ToolDefinition } from "@application/ports/ChatToolManager.port";
import type Tool from "./Tool";

class LocalToolManager implements ChatToolManagerPort {
	private readonly tools = new Map<string, Tool>();

	register(...tools: Tool[]): void {
		for (const tool of tools) this.tools.set(tool.definition.name, tool);
	}

	getTools(): Promise<ToolDefinition[]> {
		return Promise.resolve([...this.tools.values()].map((t) => t.definition));
	}

	executeTool(name: string, args: Record<string, unknown>): Promise<string> {
		if (!this.tools.has(name)) {
			return Promise.reject(new Error(`Tool not found: ${name}`));
		}

		// biome-ignore lint/style/noNonNullAssertion: checked for existence above
		return this.tools.get(name)!.execute(args);
	}
}

export default LocalToolManager;
