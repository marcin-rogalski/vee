import type { ChatSessionSummaryDto } from '@application/dto/Session.dto'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'

class SessionListUseCase {
	constructor(readonly sessionRepository: SessionRepositoryPort) {
		//
	}

	async execute(agentId: string): Promise<Array<ChatSessionSummaryDto>> {
		return await this.sessionRepository.findAllByAgentId(agentId)
	}
}

export default SessionListUseCase
