import type Agent from '@domain/Agent'
import { useEffect, useState } from 'react'

type Session = { id: string; title: string; name: string }
export type AgentItem = Pick<Agent, 'id' | 'name' | 'description'>

type Props = {
	sessions: {
		list: () => Promise<Array<{ id: string; name: string }>>
	}
	agents: {
		list: () => Promise<Array<AgentItem>>
	}
}

export function useSessionData({ sessions, agents }: Props) {
	const [sessionList, setSessionList] = useState<Session[] | null>(null)
	const [agentList, setAgentList] = useState<AgentItem[] | null>(null)

	useEffect(() => {
		Promise.all([
			sessions
				.list()
				.then((data) =>
					setSessionList(data.map((s) => ({ ...s, title: s.name }))),
				),
			agents
				.list()
				.then((data) =>
					setAgentList(data.map((a) => ({ id: a.id, name: a.name }))),
				),
		])
	}, [])

	return { sessionList, agentList, setSessionList, setAgentList }
}
