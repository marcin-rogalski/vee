import type ConversationEntry from '@domain/ConversationEntry'
import type { ToolDefinition } from './Tool.port'

interface ProviderPort {
	id: string
	type: string

	countTokens: (contextEntry: ConversationEntry) => number
	compact: (
		context: readonly ConversationEntry[],
	) => Promise<Array<ConversationEntry>>
	shouldCompact: (context: readonly ConversationEntry[]) => boolean
	infer(
		configuration: Record<string, unknown>,
		context: readonly ConversationEntry[],
		tools: readonly ToolDefinition[],
	): AsyncGenerator<ProviderEvent>
}

export default ProviderPort

type ProviderEvent =
	| { type: 'token'; content: string }
	| { type: 'thought'; content: string }
	| {
			type: 'tool-call'
			toolCalls: Array<{ name: string; arguments: string }>
	  }
