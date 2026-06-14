import type Agent from '@domain/Agent'
import type Provider from '@domain/Provider'
import { Box, Text, useInput } from 'ink'
import { useState } from 'react'

import { AddAgentForm, AGENT_ADD_FIELDS } from './components/AddAgentForm'
import {
	AddProviderForm,
	PROVIDER_ADD_FIELDS,
} from './components/AddProviderForm'
import { ConfigMenu } from './components/ConfigMenu'
import { RemoveAgentList } from './components/RemoveAgentList'
import { RemoveProviderList } from './components/RemoveProviderList'
import { SaveStatus } from './components/SaveStatus'
import { useConfigData } from './hooks/useConfigData'
import { useMultiStepForm } from './hooks/useMultiStepForm'

type Props = {
	agents: {
		list: () => Promise<Array<Pick<Agent, 'id' | 'name' | 'description'>>>
	}
	onUpsertAgent: (agent: {
		id?: string
		name: string
		description?: string
	}) => Promise<void>
	onDeleteAgent: (id: string) => Promise<void>
	providers: { list: () => Promise<Array<Pick<Provider, 'id' | 'name'>>> }
	onUpsertProvider: (provider: {
		id?: string
		name: string
		type: string
	}) => Promise<void>
	onDeleteProvider: (id: string) => Promise<void>
	onBack: () => void
}

type Mode =
	| 'menu'
	| 'addAgent'
	| 'removeAgent'
	| 'addProvider'
	| 'removeProvider'

export function ConfigScreen({
	agents,
	onUpsertAgent,
	onDeleteAgent,
	providers,
	onUpsertProvider,
	onDeleteProvider,
	onBack,
}: Props) {
	const { agentList, providerList, setAgentList, setProviderList } =
		useConfigData({
			agents,
			providers,
		})
	const [mode, setMode] = useState<Mode>('menu')

	const agentForm = useMultiStepForm(AGENT_ADD_FIELDS)
	const providerForm = useMultiStepForm(PROVIDER_ADD_FIELDS)

	useInput((_input: string, key: { escape?: boolean }) => {
		if (!key.escape) {
			return
		}
		if (mode === 'menu') {
			onBack()
		} else {
			setMode('menu')
			agentForm.setSaveStatus('idle')
			providerForm.setSaveStatus('idle')
		}
	})

	if (agentList === null || providerList === null) {
		return (
			<Box padding={1}>
				<Text>Loading...</Text>
			</Box>
		)
	}

	const showSaved = () => {
		setTimeout(() => agentForm.setSaveStatus('idle'), 1500)
	}

	const handleMenuSelect = (action: string) => {
		if (action === 'back') {
			onBack()
			return
		}
		if (action === 'addAgent') {
			agentForm.reset()
		}
		if (action === 'addProvider') {
			providerForm.reset()
		}
		setMode(action as Mode)
	}

	const handleAgentAddSubmit = async (value: string) => {
		const result = agentForm.onSubmit(value)
		if (result === 'next') {
			return
		}

		agentForm.setSaveStatus('saving')
		await onUpsertAgent({
			name: agentForm.addValues.name ?? '',
			...(agentForm.addValues.description !== undefined &&
				agentForm.addValues.description !== '' && {
					description: agentForm.addValues.description,
				}),
		})
		const updated = await agents.list()
		setAgentList(updated)
		agentForm.setSaveStatus('saved')
		setMode('menu')
		showSaved()
	}

	const handleProviderAddSubmit = async (value: string) => {
		const result = providerForm.onSubmit(value)
		if (result === 'next') {
			return
		}

		providerForm.setSaveStatus('saving')
		await onUpsertProvider({
			name: providerForm.addValues.name ?? '',
			type: providerForm.addValues.type ?? '',
		})
		const updated = await providers.list()
		setProviderList(updated)
		providerForm.setSaveStatus('saved')
		setMode('menu')
		showSaved()
	}

	const handleRemoveAgentSelect = async (item: {
		label: string
		value: string
	}) => {
		agentForm.setSaveStatus('saving')
		await onDeleteAgent(item.value)
		const updated = await agents.list()
		setAgentList(updated)
		agentForm.setSaveStatus('removed')
		setMode('menu')
		showSaved()
	}

	const handleRemoveProviderSelect = async (item: {
		label: string
		value: string
	}) => {
		providerForm.setSaveStatus('saving')
		await onDeleteProvider(item.value)
		const updated = await providers.list()
		setProviderList(updated)
		providerForm.setSaveStatus('removed')
		setMode('menu')
		showSaved()
	}

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>Config</Text>
			<Box marginTop={1} flexDirection="column">
				<Text>Agents: {agentList.length}</Text>
				<Text>Providers: {providerList.length}</Text>
			</Box>

			{mode === 'menu' && (
				<ConfigMenu
					agentCount={agentList.length}
					providerCount={providerList.length}
					isFocused={agentForm.saveStatus === 'idle'}
					onSelect={handleMenuSelect}
				/>
			)}

			{mode === 'addAgent' && (
				<AddAgentForm
					fieldIndex={agentForm.addFieldIndex}
					values={agentForm.addValues}
					currentValue={agentForm.currentFieldValue}
					onChange={(v) => agentForm.setCurrentFieldValue(v)}
					onSubmit={handleAgentAddSubmit}
					isFocused={agentForm.saveStatus === 'idle'}
				/>
			)}

			{mode === 'addProvider' && (
				<AddProviderForm
					fieldIndex={providerForm.addFieldIndex}
					values={providerForm.addValues}
					currentValue={providerForm.currentFieldValue}
					onChange={(v) => providerForm.setCurrentFieldValue(v)}
					onSubmit={handleProviderAddSubmit}
					isFocused={providerForm.saveStatus === 'idle'}
				/>
			)}

			{mode === 'removeAgent' && (
				<RemoveAgentList
					agents={agentList}
					isFocused={agentForm.saveStatus === 'idle'}
					onSelect={handleRemoveAgentSelect}
				/>
			)}

			{mode === 'removeProvider' && (
				<RemoveProviderList
					providers={providerList}
					isFocused={providerForm.saveStatus === 'idle'}
					onSelect={handleRemoveProviderSelect}
				/>
			)}

			<SaveStatus status={agentForm.saveStatus} />
			<Text dimColor>Esc to go back</Text>
		</Box>
	)
}
