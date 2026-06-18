import type Agent from '@domain/Agent'
import type ConversationEntry from '@domain/ConversationEntry'
import type ContextService from '../ports/ContextService.port'

/** Build context for inference: system prompt + conversation history.
 *
 * Delegates to ContextService which handles the repository access
 * and optional compaction.
 */
class BuildContextUseCase {
	constructor(readonly contextService: ContextService) {}

	async execute(
		agent: Agent,
		sessionId: string,
	): Promise<Array<ConversationEntry>> {
		return this.contextService.build(agent, sessionId)
	}
}

export default BuildContextUseCase
