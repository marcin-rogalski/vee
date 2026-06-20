import type { SessionData } from '@domain/Session'

type SessionDto = SessionData

export default SessionDto

export type ChatSessionSummaryDto = Pick<SessionData, 'id' | 'name' | 'agentId'>
