import type { ConversationEntry } from '@domain/ConversationEntry'
import type ToolPort from '../ports/Tool.port'

/** Execute a batch of tool calls and return results in order.
 *
 * Each tool execution is wrapped in try/catch so one failure
 * doesn't break the entire batch.
 */
class ExecuteToolsUseCase {
	async execute(
		toolCalls: Array<{ name: string; arguments: string }>,
		tools: Map<string, ToolPort>,
	): Promise<Array<ConversationEntry>> {
		const promises = toolCalls.map(async ({ name, arguments: args }) => {
			const tool = tools.get(name)
			if (!tool) {
				return {
					id: crypto.randomUUID(),
					role: 'system' as const,
					name,
					content: `Tool "${name}" not found`,
					ts: Date.now(),
				} as ConversationEntry
			}

			try {
				const result = await tool.execute(args)
				return {
					id: crypto.randomUUID(),
					role: 'system' as const,
					name,
					content: result.content,
					ts: Date.now(),
				} as ConversationEntry
			} catch (error) {
				return {
					id: crypto.randomUUID(),
					role: 'system' as const,
					name,
					content: `Error executing "${name}": ${error instanceof Error ? error.message : String(error)}`,
					ts: Date.now(),
				} as ConversationEntry
			}
		})

		return Promise.all(promises)
	}
}

export default ExecuteToolsUseCase
