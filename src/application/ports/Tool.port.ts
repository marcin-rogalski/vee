import type ToolDefinitionDto from '@application/dto/ToolDefinition.dto'

interface ToolPort {
	definition: ToolDefinitionDto
	execute(args: Record<string, unknown>): Promise<string>
}

export default ToolPort
