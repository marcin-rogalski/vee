import type Agent from '@domain/Agent'
import { Box, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import TextInput from 'ink-text-input'
import { useEffect, useState } from 'react'

type Props = {
	agents: {
		list: () => Promise<Array<Pick<Agent, 'id' | 'name' | 'description'>>>
	}
	onUpsert: (agent: {
		id?: string
		name: string
		description?: string
	}) => Promise<void>
	onDelete: (id: string) => Promise<void>
	sessions: {
		list: () => Promise<Array<{ id: string; name: string }>>
	}
	onCreateSession: (name?: string) => Promise<string>
	onBack: () => void
}

type Mode = 'menu' | 'add' | 'remove'

type AddField = 'name' | 'description'

const ADD_FIELDS: AddField[] = ['name', 'description']

const FIELD_LABELS: Record<AddField, string> = {
	name: 'Name',
	description: 'Description',
}

const MENU_ITEMS = [
	{ label: 'Add agent', value: 'add' },
	{ label: 'Remove agent', value: 'remove' },
	{ label: 'Back', value: 'back' },
]

type SaveStatus = 'idle' | 'saving' | 'saved' | 'removed'

export function ConfigScreen({ agents, onUpsert, onDelete, onBack }: Props) {
	const [agentList, setAgentList] = useState<Array<
		Pick<Agent, 'id' | 'name' | 'description'>
	> | null>(null)
	const [mode, setMode] = useState<Mode>('menu')
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

	const [addFieldIndex, setAddFieldIndex] = useState(0)
	const [addValues, setAddValues] = useState<Record<AddField, string>>({
		name: '',
		description: '',
	})
	const [currentFieldValue, setCurrentFieldValue] = useState('')

	useEffect(() => {
		agents.list().then((ags) => {
			setAgentList(ags)
		})
	}, [])

	useInput((_input: string, key: { escape?: boolean }) => {
		if (!key.escape) {
			return
		}
		if (mode === 'menu') {
			onBack()
		} else {
			setMode('menu')
			setSaveStatus('idle')
		}
	})

	if (agentList === null) {
		return (
			<Box padding={1}>
				<Text>Loading...</Text>
			</Box>
		)
	}

	const showSaved = () => {
		setTimeout(() => setSaveStatus('idle'), 1500)
	}

	const handleMenuSelect = (item: { label: string; value: string }) => {
		if (item.value === 'back') {
			onBack()
			return
		}
		if (item.value === 'remove' && agentList.length === 0) {
			return
		}
		if (item.value === 'add') {
			setAddFieldIndex(0)
			setAddValues({
				name: '',
				description: '',
			})
			setCurrentFieldValue('')
		}
		setMode(item.value as Mode)
	}

	const handleAddFieldSubmit = async (value: string) => {
		const field = ADD_FIELDS[addFieldIndex] as AddField
		const newValues: Record<AddField, string> = {
			...addValues,
			[field]: value,
		}
		setAddValues(newValues)

		if (addFieldIndex < ADD_FIELDS.length - 1) {
			const nextField = ADD_FIELDS[addFieldIndex + 1] as AddField
			setCurrentFieldValue(newValues[nextField])
			setAddFieldIndex(addFieldIndex + 1)
			return
		}

		setSaveStatus('saving')
		await onUpsert({
			name: newValues.name,
			...(newValues.description !== undefined && {
				description: newValues.description,
			}),
		})
		const updated = await agents.list()
		setAgentList(updated)
		setSaveStatus('saved')
		setMode('menu')
		showSaved()
	}

	const handleRemoveSelect = async (item: { label: string; value: string }) => {
		const removedId = item.value
		setSaveStatus('saving')
		await onDelete(removedId)
		const updated = await agents.list()
		setAgentList(updated)
		setSaveStatus('removed')
		setMode('menu')
		showSaved()
	}

	const agentItems = agentList.map((a) => ({
		label: `${a.name}${a.description ? ` (${a.description})` : ''}`,
		value: a.id,
	}))

	const menuItems =
		agentList.length === 0
			? MENU_ITEMS.map((item) =>
					item.value === 'remove'
						? { label: 'Remove agent (no agents)', value: 'remove' }
						: item,
				)
			: MENU_ITEMS

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>Config</Text>
			<Box marginTop={1} flexDirection="column">
				<Text>Agents: {agentList.length}</Text>
			</Box>

			{mode === 'menu' && (
				<Box marginTop={1} flexDirection="column">
					<SelectInput
						items={menuItems}
						isFocused={saveStatus === 'idle'}
						onSelect={handleMenuSelect}
					/>
				</Box>
			)}

			{mode === 'add' && (
				<Box marginTop={1} flexDirection="column">
					<Text bold>Add agent</Text>
					<Box marginTop={1} flexDirection="column">
						{ADD_FIELDS.slice(0, addFieldIndex).map((f) => (
							<Text key={f} dimColor>
								{FIELD_LABELS[f]}: {addValues[f]}
							</Text>
						))}
						<Box>
							<Text>
								{FIELD_LABELS[ADD_FIELDS[addFieldIndex] as AddField]}:{' '}
							</Text>
							<TextInput
								value={currentFieldValue}
								onChange={setCurrentFieldValue}
								onSubmit={handleAddFieldSubmit}
								focus={saveStatus === 'idle'}
							/>
						</Box>
					</Box>
				</Box>
			)}

			{mode === 'remove' && (
				<Box marginTop={1} flexDirection="column">
					<Text bold>Remove agent:</Text>
					<SelectInput
						items={agentItems}
						isFocused={saveStatus === 'idle'}
						onSelect={handleRemoveSelect}
					/>
				</Box>
			)}

			{saveStatus === 'saving' && <Text color="yellow">Saving...</Text>}
			{saveStatus === 'saved' && <Text color="green">Saved!</Text>}
			{saveStatus === 'removed' && <Text color="green">Removed!</Text>}
			<Text dimColor>Esc to go back</Text>
		</Box>
	)
}
