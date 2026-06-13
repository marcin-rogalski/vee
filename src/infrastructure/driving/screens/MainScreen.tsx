import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import React, { useState } from 'react'

type Screen = {
	id: string
	label: string
	component: React.ElementType
	props: (onNavigate: (id: string) => void) => Record<string, unknown>
}

type Props = { screens: Screen[] }

export function MainScreen({ screens }: Props) {
	const [activeScreen, setActiveScreen] = useState<string>('menu')
	const [sessionId, setSessionId] = useState<string | null>(null)
	const [agentId, setAgentId] = useState<string | null>(null)

	const handleSelectSession = (id: string) => {
		setSessionId(id)
		setActiveScreen('chat')
	}

	if (activeScreen === 'menu') {
		const menuItems = screens.map((s) => ({ label: s.label, value: s.id }))
		return (
			<Box flexDirection="column" padding={1}>
				<Text bold>vee</Text>
				<SelectInput
					items={menuItems}
					onSelect={(item: { label: string; value: string }) =>
						setActiveScreen(item.value)
					}
				/>
			</Box>
		)
	}

	const active = screens.find((s) => s.id === activeScreen)
	if (!active) {
		return null
	}

	return React.createElement(active.component, {
		...active.props(setActiveScreen),
		screenId: active.id,
		sessionId,
		agentId,
		onSelectSession: handleSelectSession,
		onSelectAgent: setAgentId,
	})
}
