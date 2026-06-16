import type ConversationEntry from '@domain/ConversationEntry'
import type { ToolDefinition } from '../ports/Tool.port'

/** Single-turn inference: call provider, stream events, return result.
 *
 * Does NOT own the loop — just one provider call with token/tool-call accumulation.
 */
class InferUseCase {
	async execute(
		_context: readonly ConversationEntry[],
		_configuration: Record<string, unknown>,
		_tools: readonly ToolDefinition[],
	): Promise<InferResult> {
		// TODO: stream provider events, accumulate tokens and tool calls
		throw new Error('Not implemented')
	}
}

export type InferResult = {
	tokens: string
	toolCalls?: Array<{ name: string; arguments: string }>
	thoughts: string[]
}

export default InferUseCase
