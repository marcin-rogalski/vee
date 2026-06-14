import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

export const AGENT_ADD_FIELDS = ['name', 'description'] as const
type AgentAddField = (typeof AGENT_ADD_FIELDS)[number]

const AGENT_FIELD_LABELS: Record<AgentAddField, string> = {
	name: 'Name',
	description: 'Description',
}

type Props = {
	fieldIndex: number
	values: Record<string, string>
	currentValue: string
	onChange: (value: string) => void
	onSubmit: (value: string) => void
	isFocused: boolean
}

export function AddAgentForm({
	fieldIndex,
	values,
	currentValue,
	onChange,
	onSubmit,
	isFocused,
}: Props) {
	const currentField = AGENT_ADD_FIELDS[fieldIndex]
	const currentLabel =
		currentField !== undefined ? AGENT_FIELD_LABELS[currentField] : ''

	return (
		<Box marginTop={1} flexDirection="column">
			<Text bold>Add agent</Text>
			<Box marginTop={1} flexDirection="column">
				{AGENT_ADD_FIELDS.slice(0, fieldIndex).map((f) => (
					<Text key={f} dimColor>
						{AGENT_FIELD_LABELS[f]}: {values[f]}
					</Text>
				))}
				<Box>
					<Text>{currentLabel}:</Text>
					<TextInput
						value={currentValue}
						onChange={onChange}
						onSubmit={onSubmit}
						focus={isFocused}
					/>
				</Box>
			</Box>
		</Box>
	)
}
