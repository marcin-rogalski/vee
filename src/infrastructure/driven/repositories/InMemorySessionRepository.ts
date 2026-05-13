import type ChatSessionDto from '@application/dto/Session.dto'
import type { ChatSessionSummaryDto } from '@application/dto/Session.dto'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class InMemorySessionRepository implements SessionRepositoryPort {
	private sessions: Map<string, ChatSessionDto> = new Map()

	async findById(id: string): Promise<ChatSessionDto | null> {
		return this.sessions.get(id) ?? null
	}

	async findAllByAgentId(
		_agentId: string,
	): Promise<Array<ChatSessionSummaryDto>> {
		// TODO: In a real implementation, we'd need to store agentId on session
		// and index by it. For now, return all sessions as summaries.
		return Array.from(this.sessions.values()).map(({ id, name }) => ({
			id,
			name,
		}))
	}

	async save(session: ChatSessionDto): Promise<void> {
		this.sessions.set(session.id, session)
	}

	async delete(id: string): Promise<void> {
		this.sessions.delete(id)
	}
}

export default InMemorySessionRepository
