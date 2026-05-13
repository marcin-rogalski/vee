import type ContextEntryDto from '@application/dto/ContextEntry.dto'
import type IntegrationEventDto from '@application/dto/IntegrationEvent.dto'
import type ToolDefinitionDto from '@application/dto/ToolDefinition.dto'
import type { Schema as ZodSchema } from 'zod'

/**
 * Runtime layer — interface with behavior, no serialization.
 * Implemented by infrastructure adapters (e.g., OpenAI, Slack).
 */
interface IntegrationRuntimePort {
	readonly configSchema: ZodSchema // Validates integration configuration
	readonly modelSchema: ZodSchema // Declares accepted model configuration shapes

	infer(
		modelConfiguration: object,
		context: ContextEntryDto[],
		tools: ToolDefinitionDto[],
	): AsyncGenerator<IntegrationEventDto>
}

export default IntegrationRuntimePort
