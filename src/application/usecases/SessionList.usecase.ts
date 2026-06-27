import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import type { SessionData } from '@domain/Session'

class SessionListUseCase {
	constructor(readonly sessionRepository: SessionRepositoryPort) {}

	async execute(): Promise<
		Array<Pick<SessionData, 'id' | 'name' | 'agentId'>>
	> {
		return await this.sessionRepository.list()
	}
}

export default SessionListUseCase
