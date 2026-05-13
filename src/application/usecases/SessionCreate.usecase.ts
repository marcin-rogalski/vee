import type SessionManagerPort from '@application/ports/SessionManager.port'

class SessionCreateUseCase {
	constructor(readonly sessionManager: SessionManagerPort) {
		//
	}

	async execute(): Promise<string> {
		const session = await this.sessionManager.create()
		return session.id
	}
}

export default SessionCreateUseCase
