import type ConversationEntry from '@domain/ConversationEntry'
import type ToolPort from '../ports/Tool.port'

/** Execute a batch of tool calls and return results in order.
 *
 * Each tool execution is wrapped in try/catch so one failure
 * doesn't break the entire batch.
 */
class ExecuteToolsUseCase {
	async execute(
		_toolCalls: Array<{ name: string; arguments: string }>,
		_tools: Map<string, ToolPort>,
	): Promise<Array<ConversationEntry>> {
		// TODO: execute all tool calls with Promise.allSettled, preserve order
		throw new Error('Not implemented')
	}
}

export default ExecuteToolsUseCase
