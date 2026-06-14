import type Agent from '@domain/Agent'
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'

type Props = {
	agents: Pick<Agent, 'id' | 'name' | 'description'>[]
	isFocused: boolean
	onSelect: (item: { label: string; value: string }) => void
}

export function RemoveAgentList({ agents, isFocused, onSelect }: Props) {
	// todo: check if we should use useMemo here
	const items = agents.map((a) => ({
		label: `${a.name}${a.description ? ` (${a.description})` : ''}`,
		value: a.id,
	}))

	return (
		<Box marginTop={1} flexDirection="column">
			<Text bold>Remove agent:</Text>
			<SelectInput items={items} isFocused={isFocused} onSelect={onSelect} />
		</Box>
	)
}
