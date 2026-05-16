import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class SessionCreateUseCase {
	constructor(readonly sessionRepository: SessionRepositoryPort) {}

	async execute(name?: string): Promise<string> {
		const session = await this.sessionRepository.create(name ?? '')
		return session.id
	}
}

export default SessionCreateUseCase
