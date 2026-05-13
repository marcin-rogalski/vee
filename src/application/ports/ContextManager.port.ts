import type AgentDto from '@application/dto/Agent.dto'
import type ContextDto from '@application/dto/Context.dto'
import type ChatSessionDto from '@application/dto/Session.dto'

interface ContextManagerPort {
	getContext(session: ChatSessionDto, agent: AgentDto): Promise<ContextDto>
}

export default ContextManagerPort
