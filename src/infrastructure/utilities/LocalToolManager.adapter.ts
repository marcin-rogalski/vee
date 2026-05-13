import type ToolDefinitionDto from '@application/dto/ToolDefinition.dto'
import type ToolPort from '@application/ports/Tool.port'
import type ToolManagerPort from '@application/ports/ToolManager.port'

class LocalToolManagerAdapter implements ToolManagerPort {
	private readonly tools = new Map<string, ToolPort>()

	register(...tools: ToolPort[]): void {
		for (const tool of tools) this.tools.set(tool.definition.name, tool)
	}

	async getTools(): Promise<ToolDefinitionDto[]> {
		return [...this.tools.values()].map((t) => t.definition)
	}

	async executeTool(
		name: string,
		args: Record<string, unknown>,
	): Promise<{ result: string; code?: number }> {
		if (!this.tools.has(name)) {
			return { result: `Tool not found: ${name}`, code: 404 }
		}

		// biome-ignore lint/style/noNonNullAssertion: checked for existence above
		const result = await this.tools.get(name)!.execute(args)
		return { result }
	}
}

export default LocalToolManagerAdapter
