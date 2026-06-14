import { Box } from 'ink'
import SelectInput from 'ink-select-input'

type MenuAction =
	| 'addAgent'
	| 'removeAgent'
	| 'addProvider'
	| 'removeProvider'
	| 'back'

type Props = {
	agentCount: number
	providerCount: number
	isFocused: boolean
	onSelect: (action: MenuAction) => void
}

export function ConfigMenu({
	agentCount,
	providerCount,
	isFocused,
	onSelect,
}: Props) {
	// todo: move outside the component
	const items = [
		{ label: 'Add agent', value: 'addAgent' as const },
		{ label: 'Remove agent', value: 'removeAgent' as const },
		{ label: 'Add provider', value: 'addProvider' as const },
		{ label: 'Remove provider', value: 'removeProvider' as const },
		{ label: 'Back', value: 'back' as const },
	]

	// todo: check if we should use useMemo here
	const dynamicItems = items.map((item) => {
		if (item.value === 'removeAgent' && agentCount === 0) {
			return { ...item, label: 'Remove agent (no agents)' }
		}
		if (item.value === 'removeProvider' && providerCount === 0) {
			return { ...item, label: 'Remove provider (no providers)' }
		}
		return item
	})

	const handleSelect = (item: { value: MenuAction }) => {
		if (item.value === 'removeAgent' && agentCount === 0) {
			return
		}
		if (item.value === 'removeProvider' && providerCount === 0) {
			return
		}
		onSelect(item.value)
	}

	return (
		<Box marginTop={1} flexDirection="column">
			<SelectInput
				items={dynamicItems}
				isFocused={isFocused}
				onSelect={handleSelect}
			/>
		</Box>
	)
}
