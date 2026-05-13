import type ContextEntryDto from './ContextEntry.dto'

interface ChatSessionDto {
	id: string
	name: string
	history: ContextEntryDto[]
	createdAt: number
	updatedAt: number
}

export default ChatSessionDto

export interface ChatSessionSummaryDto {
	id: string
	name: string
}
