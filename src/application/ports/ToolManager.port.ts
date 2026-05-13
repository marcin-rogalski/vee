import type ToolDefinitionDto from '@application/dto/ToolDefinition.dto'

interface ToolManagerPort {
	getTools(): Promise<ToolDefinitionDto[]>
	executeTool(
		toolName: string,
		args: Record<string, unknown>,
	): Promise<{ result: string; code?: number }>
}

export default ToolManagerPort
