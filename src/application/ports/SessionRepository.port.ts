import type ChatSessionDto from '@application/dto/Session.dto'
import type { ChatSessionSummaryDto } from '@application/dto/Session.dto'

interface SessionRepositoryPort {
	findById(id: string): Promise<ChatSessionDto | null>
	findAllByAgentId(agentId: string): Promise<Array<ChatSessionSummaryDto>>
	save(session: ChatSessionDto): Promise<void>
	delete(id: string): Promise<void>
}

export default SessionRepositoryPort
