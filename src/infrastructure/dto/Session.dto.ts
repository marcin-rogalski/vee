import type Session from '@domain/Session'

type SessionDto = Session

export default SessionDto

export type ChatSessionSummaryDto = Pick<Session, 'id' | 'name'>
