import type Agent from '@domain/Agent'
import type ConversationEntry from '@domain/ConversationEntry'

/** Service that wraps ContextRepository with domain behavior.
 *
 * - build() — assembles context from system prompt + history
 * - append() — delegates to repository
 * - compact() — checks provider.shouldCompact() + replaces context
 */
interface ContextService {
	build(agent: Agent, sessionId: string): Promise<Array<ConversationEntry>>
	append(sessionId: string, ...entries: Array<ConversationEntry>): Promise<void>
	compact(
		sessionId: string,
		shouldCompact: (context: readonly ConversationEntry[]) => boolean,
		compact: (
			context: readonly ConversationEntry[],
		) => Promise<Array<ConversationEntry>>,
	): Promise<void>
}

export default ContextService
