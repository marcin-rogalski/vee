import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class SessionDeleteUseCase {
	constructor(readonly sessionRepository: SessionRepositoryPort) {
		//
	}

	async execute(id: string): Promise<void> {
		await this.sessionRepository.delete(id)
	}
}

export default SessionDeleteUseCase
