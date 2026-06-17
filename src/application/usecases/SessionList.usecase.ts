import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class SessionListUseCase {
	constructor(readonly sessionRepository: SessionRepositoryPort) {}

	async execute(): Promise<Array<Pick<Session, 'id' | 'name' | 'agentId'>>> {
		return await this.sessionRepository.list()
	}
}

import type Session from '@domain/Session'
export default SessionListUseCase
