interface ToolPort {
	id: string
	description: string
	definition: ToolDefinition
	execute(
		parameters: string,
	): Promise<{ content: string; code: number | undefined }>
}

export default ToolPort

export interface ToolDefinition {
	name: string
	description: string
	parameters: string
}
