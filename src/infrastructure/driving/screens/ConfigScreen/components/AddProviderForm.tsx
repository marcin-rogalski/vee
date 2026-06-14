import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

export const PROVIDER_ADD_FIELDS = ['name', 'type'] as const
type ProviderAddField = (typeof PROVIDER_ADD_FIELDS)[number]

const PROVIDER_FIELD_LABELS: Record<ProviderAddField, string> = {
	name: 'Name',
	type: 'Type (e.g., openai)',
}

type Props = {
	fieldIndex: number
	values: Record<string, string>
	currentValue: string
	onChange: (value: string) => void
	onSubmit: (value: string) => void
	isFocused: boolean
}

export function AddProviderForm({
	fieldIndex,
	values,
	currentValue,
	onChange,
	onSubmit,
	isFocused,
}: Props) {
	const currentField = PROVIDER_ADD_FIELDS[fieldIndex]
	const currentLabel =
		currentField !== undefined ? PROVIDER_FIELD_LABELS[currentField] : ''

	return (
		<Box marginTop={1} flexDirection="column">
			<Text bold>Add provider</Text>
			<Box marginTop={1} flexDirection="column">
				{PROVIDER_ADD_FIELDS.slice(0, fieldIndex).map((f) => (
					<Text key={f} dimColor>
						{PROVIDER_FIELD_LABELS[f]}: {values[f]}
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
