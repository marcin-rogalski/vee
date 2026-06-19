import type { ProviderEvent } from '@application/ports/Provider.port'
import type { ToolDefinition } from '@application/ports/Tool.port'
import type ConversationEntry from '@domain/ConversationEntry'
import type { JsonSchemaObject } from '@domain/JsonSchema'
import ProviderBase from './ProviderBase'

/** OpenAI provider implementation.
 *
 * Configuration schema defines the fields the CLI/Web form will render:
 * - apiKey (required string) — OpenAI API key
 * - model (required string with enum) — model selection dropdown
 * - temperature (optional number) — creativity slider
 */
class OpenAIProvider extends ProviderBase {
	readonly id: string
	override type = 'openai'

	static override CONFIG_SCHEMA = {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		type: 'object' as const,
		description: 'OpenAI API configuration',
		properties: {
			apiKey: {
				type: 'string',
				description: 'OpenAI API key',
			},
			model: {
				type: 'string',
				description: 'Model to use for inference',
				enum: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
			},
			temperature: {
				type: 'number',
				description: 'Sampling temperature (0-2)',
			},
		},
		required: ['apiKey', 'model'],
	} as unknown as JsonSchemaObject

	constructor(id: string) {
		super()
		this.id = id
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	infer(
		_configuration: Record<string, unknown>,
		_context: readonly ConversationEntry[],
		_tools: readonly ToolDefinition[],
	): AsyncGenerator<ProviderEvent> {
		// Stub — real implementation will call OpenAI API
		throw new Error('Not implemented')
	}
}

export default OpenAIProvider
