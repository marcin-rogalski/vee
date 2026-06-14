import type Provider from '@domain/Provider'
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'

type Props = {
	providers: Pick<Provider, 'id' | 'name'>[]
	isFocused: boolean
	onSelect: (item: { label: string; value: string }) => void
}

export function RemoveProviderList({ providers, isFocused, onSelect }: Props) {
	// todo: check if we should use useMemo here
	const items = providers.map((p) => ({
		label: p.name,
		value: p.id,
	}))

	return (
		<Box marginTop={1} flexDirection="column">
			<Text bold>Remove provider:</Text>
			<SelectInput items={items} isFocused={isFocused} onSelect={onSelect} />
		</Box>
	)
}
