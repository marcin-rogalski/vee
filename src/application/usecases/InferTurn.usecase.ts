import type ConversationEntry from '@domain/ConversationEntry'
import type ProviderPort from '../ports/Provider.port'
import type { ToolDefinition } from '../ports/Tool.port'

/** Single-turn inference: call provider, stream events, return result.
 *
 * Does NOT own the loop — just one provider call with token/tool-call accumulation.
 */
class InferTurnUseCase {
	constructor(private readonly provider: ProviderPort) {}

	async execute(
		context: readonly ConversationEntry[],
		configuration: Record<string, unknown>,
		tools: readonly ToolDefinition[],
	): Promise<InferResult> {
		const tokens: string[] = []
		const thoughts: string[] = []
		let toolCalls: Array<{ name: string; arguments: string }> | undefined

		for await (const event of this.provider.infer(
			configuration,
			context,
			tools,
		)) {
			switch (event.type) {
				case 'token':
					tokens.push(event.content)
					break
				case 'thought':
					thoughts.push(event.content)
					break
				case 'tool-call':
					toolCalls = event.toolCalls
					break
			}
		}

		return {
			tokens: tokens.join(''),
			thoughts,
			...(toolCalls && { toolCalls }),
		}
	}
}

export type InferResult = {
	tokens: string
	toolCalls?: Array<{ name: string; arguments: string }>
	thoughts: string[]
}

export default InferTurnUseCase
