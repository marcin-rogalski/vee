import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type ContextService from '@application/ports/ContextService.port'
import type { AgentData } from '@domain/Agent'
import type { ConversationEntry } from '@domain/ConversationEntry'

/** Infrastructure adapter that implements ContextService using ContextRepositoryPort.
 *
 * - build() — prepends system prompt entry, then appends repository history
 * - append() — delegates directly to repository
 * - compact() — checks shouldCompact predicate, then replaces context if needed
 */
class ContextServiceAdapter implements ContextService {
	constructor(private readonly repository: ContextRepositoryPort) {}

	async build(
		agent: AgentData,
		sessionId: string,
	): Promise<Array<ConversationEntry>> {
		const history = await this.repository.get(sessionId)

		const systemEntry: ConversationEntry = {
			id: crypto.randomUUID(),
			role: 'system',
			content: agent.systemPrompt,
			ts: Date.now(),
		}

		return [systemEntry, ...history]
	}

	async append(
		sessionId: string,
		...entries: Array<ConversationEntry>
	): Promise<void> {
		await this.repository.append(sessionId, ...entries)
	}

	async compact(
		sessionId: string,
		shouldCompact: (context: readonly ConversationEntry[]) => boolean,
		compact: (
			context: readonly ConversationEntry[],
		) => Promise<Array<ConversationEntry>>,
	): Promise<void> {
		const current = await this.repository.get(sessionId)

		if (!shouldCompact(current)) {
			return
		}

		const compacted = await compact(current)
		await this.repository.update(sessionId, compacted)
	}
}

export default ContextServiceAdapter
