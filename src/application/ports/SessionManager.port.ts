import type ContextEntryDto from '@application/dto/ContextEntry.dto'
import type ChatSessionDto from '@application/dto/Session.dto'

interface SessionManagerPort {
	get(id: string): Promise<ChatSessionDto>
	create(): Promise<ChatSessionDto>
	append(id: string, ...messages: ContextEntryDto[]): Promise<void>
}

export default SessionManagerPort
