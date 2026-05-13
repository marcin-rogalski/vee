export interface ToolDefinitionDto {
	name: string
	description: string
	parameters: Record<string, unknown>
}

export default ToolDefinitionDto
