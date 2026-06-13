import type Agent from '@domain/Agent'
import { Box, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import { useEffect, useState } from 'react'

type Session = { id: string; title: string; name: string }
type AgentItem = Pick<Agent, 'id' | 'name' | 'description'>

type Props = {
	sessions: {
		list: () => Promise<Array<{ id: string; name: string }>>
	}
	onCreateSession: (name?: string) => Promise<string>
	agents: {
		list: () => Promise<Array<AgentItem>>
	}
	onSelectSession: (sessionId: string) => void
	onSelectAgent: (agentId: string) => void
	onBack: () => void
	sessionId?: string | null
	agentId?: string | null
}

export function SessionScreen({
	sessions,
	onCreateSession,
	agents,
	onSelectSession,
	onBack,
}: Props) {
	const [sessionList, setSessionList] = useState<Session[] | null>(null)
	const [agentList, setAgentList] = useState<AgentItem[] | null>(null)
	const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

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

	useInput((_input: string, key: { escape?: boolean }) => {
		if (key.escape) {
			onBack()
		}
	})

	const handleSelectAgent = (agent: { label: string; value: string }) => {
		setSelectedAgentId(agent.value)
	}

	if (sessionList === null || agentList === null) {
		return (
			<Box padding={1}>
				<Text>Loading...</Text>
			</Box>
		)
	}

	const items = [
		{ label: 'New session', value: '__new__' },
		...sessionList.map((session) => ({
			label: session.title,
			value: session.id,
		})),
	]

	const handleSelect = async (item: { label: string; value: string }) => {
		if (!selectedAgentId) {
			return
		}

		if (item.value === '__new__') {
			const sessionId = await onCreateSession('New Session')
			onSelectSession(sessionId)
		} else {
			onSelectSession(item.value)
		}
	}

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>Sessions</Text>
			{agentList && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Agent:</Text>
					<SelectInput
						items={agentList.map((a) => ({ label: a.name, value: a.id }))}
						onSelect={handleSelectAgent}
					/>
				</Box>
			)}
			<Box flexDirection="column" marginTop={1}>
				<SelectInput items={items} onSelect={handleSelect} />
			</Box>
			<Text dimColor>Esc to go back</Text>
		</Box>
	)
}
