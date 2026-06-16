import type ProviderPort from '@application/ports/Provider.port'
import type { ToolDefinition } from '@application/ports/Tool.port'
import type ConversationEntry from '@domain/ConversationEntry'
import type { JsonSchemaObject } from '@domain/JsonSchema'

/** Abstract base class for all provider implementations.
 *
 * Subclasses MUST override:
 * - static `CONFIG_SCHEMA` — JSON Schema describing configuration fields
 * - `type` — unique identifier matching registry key
 * - `infer()` — streaming inference logic
 *
 * Subclasses SHOULD override:
 * - `countTokens()`, `compact()`, `shouldCompact()` — context management
 */
abstract class ProviderBase implements ProviderPort {
	abstract id: string
	abstract type: string

	/** JSON Schema defining the configuration shape for this provider type.
	 * Subclasses override this as a static property.
	 */
	static CONFIG_SCHEMA: JsonSchemaObject = {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		type: 'object' as const,
		properties: {},
	}

	// --- ProviderPort implementation ---

	countTokens(_contextEntry: ConversationEntry): number {
		return 0
	}

	shouldCompact(_context: readonly ConversationEntry[]): boolean {
		return false
	}

	async compact(
		_context: readonly ConversationEntry[],
	): Promise<Array<ConversationEntry>> {
		return []
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	abstract infer(
		configuration: Record<string, unknown>,
		context: readonly ConversationEntry[],
		tools: readonly ToolDefinition[],
	): AsyncGenerator<ProviderEvent>
}

export default ProviderBase
export type ProviderEvent =
	| { type: 'token'; content: string }
	| { type: 'thought'; content: string }
	| {
			type: 'tool-call'
			toolCalls: Array<{ name: string; arguments: string }>
	  }
