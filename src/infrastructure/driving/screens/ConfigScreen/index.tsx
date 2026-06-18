import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import type ToolRegistryPort from '@application/ports/ToolRegistry.port'
import type Agent from '@domain/Agent'
import { isTypedProperty } from '@domain/JsonSchema'
import type Provider from '@domain/Provider'
import { Box, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import TextInput from 'ink-text-input'
import { useState } from 'react'

import { ConfigMenu } from './components/ConfigMenu'
import { RemoveAgentList } from './components/RemoveAgentList'
import { RemoveProviderList } from './components/RemoveProviderList'
import { SaveStatus } from './components/SaveStatus'
import { SchemaDrivenForm } from './components/SchemaDrivenForm'
import { useConfigData } from './hooks/useConfigData'
import { useMultiStepForm } from './hooks/useMultiStepForm'

// Available provider types from the registry
const AVAILABLE_PROVIDER_TYPES = ['openai']

type Props = {
	agents: {
		list: () => Promise<Array<Pick<Agent, 'id' | 'name' | 'description'>>>
	}
	onUpsertAgent: (agent: {
		name: string
		description?: string
		systemPrompt: string
		providerId: string
		providerOverrides: Record<string, unknown>
		toolIds: string[]
	}) => Promise<void>
	onDeleteAgent: (id: string) => Promise<void>
	providers: {
		list: () => Promise<Array<Pick<Provider, 'id' | 'name' | 'type'>>>
	}
	onUpsertProvider: (provider: {
		id?: string
		name: string
		type: string
		config: Record<string, unknown>
	}) => Promise<void>
	onDeleteProvider: (id: string) => Promise<void>
	providerRegistry: ProviderRegistryPort
	toolRegistry: ToolRegistryPort
	onBack: () => void
}

type Mode =
	| 'menu'
	| 'addAgentName'
	| 'addAgentDescription'
	| 'addAgentPrompt'
	| 'addAgentProvider'
	| 'addAgentOverrides'
	| 'addAgentTools'
	| 'removeAgent'
	| 'addProviderType'
	| 'addProviderName'
	| 'addProviderConfig'
	| 'removeProvider'

// Collected agent form values during multi-step flow
interface AgentFormValues {
	name: string
	description: string
	systemPrompt: string
	providerId: string
	providerOverrides: Record<string, unknown>
	toolIds: string[]
}

const emptyAgentValues = (): AgentFormValues => ({
	name: '',
	description: '',
	systemPrompt: '',
	providerId: '',
	providerOverrides: {},
	toolIds: [],
})

export function ConfigScreen({
	agents,
	onUpsertAgent,
	onDeleteAgent,
	providers,
	onUpsertProvider,
	onDeleteProvider,
	providerRegistry,
	toolRegistry,
	onBack,
}: Props) {
	const { agentList, providerList, setAgentList, setProviderList } =
		useConfigData({
			agents,
			providers,
		})
	const [mode, setMode] = useState<Mode>('menu')
	const [saveStatus, setSaveStatus] = useState<
		'idle' | 'saving' | 'saved' | 'removed'
	>('idle')

	const providerForm = useMultiStepForm(['name'])

	// State for schema-driven provider form
	const [selectedProviderType, setSelectedProviderType] = useState('')
	const [selectedProviderName, setSelectedProviderName] = useState('')

	// State for multi-step agent form
	const [agentValues, setAgentValues] = useState<AgentFormValues>(
		emptyAgentValues(),
	)
	const [currentAgentInput, setCurrentAgentInput] = useState('')

	const resetAgentForm = () => {
		setAgentValues(emptyAgentValues())
		setCurrentAgentInput('')
	}

	useInput((_input: string, key: { escape?: boolean }) => {
		if (!key.escape) {
			return
		}
		if (mode === 'menu') {
			onBack()
		} else if (mode === 'addAgentTools') {
			// Esc finishes tool selection and saves the agent
			handleAgentToolsFinish()
		} else {
			setMode('menu')
			setSaveStatus('idle')
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
		setTimeout(() => setSaveStatus('idle'), 1500)
	}

	const handleMenuSelect = (action: string) => {
		if (action === 'back') {
			onBack()
			return
		}
		if (action === 'addAgent') {
			resetAgentForm()
			setMode('addAgentName')
			return
		}
		if (action === 'addProvider') {
			providerForm.reset()
			setSelectedProviderType('')
			setSelectedProviderName('')
			setMode('addProviderType')
			return
		}
		setMode(action as Mode)
	}

	const handleAgentNameSubmit = (value: string) => {
		setAgentValues((prev) => ({ ...prev, name: value }))
		setCurrentAgentInput('')
		setMode('addAgentDescription')
	}

	const handleAgentDescriptionSubmit = (value: string) => {
		setAgentValues((prev) => ({ ...prev, description: value }))
		setCurrentAgentInput('')
		setMode('addAgentPrompt')
	}

	const handleAgentPromptSubmit = (value: string) => {
		setAgentValues((prev) => ({ ...prev, systemPrompt: value }))
		setCurrentAgentInput('')
		setMode('addAgentProvider')
	}

	const handleAgentProviderSelect = (item: {
		value: string
		label: string
	}) => {
		setAgentValues((prev) => ({ ...prev, providerId: item.value }))
		setMode('addAgentOverrides')
	}

	const handleAgentOverridesComplete = (overrides: Record<string, string>) => {
		// Convert string values to appropriate types based on schema
		const typedOverrides: Record<string, unknown> = {}
		try {
			const selectedProvider = providerList.find(
				(p) => p.id === agentValues.providerId,
			)
			if (selectedProvider) {
				const schema = providerRegistry.schema(selectedProvider.type)
				for (const [key, val] of Object.entries(overrides)) {
					const prop = schema.properties[key]
					if (prop && isTypedProperty(prop) && prop.type === 'number') {
						typedOverrides[key] = val === '' ? undefined : Number(val)
					} else if (prop && isTypedProperty(prop) && prop.type === 'boolean') {
						typedOverrides[key] = val === 'true'
					} else {
						typedOverrides[key] = val
					}
				}
			} else {
				for (const [key, val] of Object.entries(overrides)) {
					typedOverrides[key] = val
				}
			}
		} catch {
			// Schema not available, use raw values
			for (const [key, val] of Object.entries(overrides)) {
				typedOverrides[key] = val
			}
		}
		setAgentValues((prev) => ({ ...prev, providerOverrides: typedOverrides }))
		setMode('addAgentTools')
	}

	const handleAgentToolsSelect = (item: { value: string; label: string }) => {
		setAgentValues((prev) => {
			const existing = prev.toolIds.includes(item.value)
				? prev.toolIds.filter((id) => id !== item.value)
				: [...prev.toolIds, item.value]
			return { ...prev, toolIds: existing }
		})
	}

	const handleAgentToolsFinish = async () => {
		setSaveStatus('saving')
		await onUpsertAgent({
			name: agentValues.name,
			...(agentValues.description !== '' && {
				description: agentValues.description,
			}),
			systemPrompt: agentValues.systemPrompt,
			providerId: agentValues.providerId,
			providerOverrides: agentValues.providerOverrides,
			toolIds: agentValues.toolIds,
		})
		const updated = await agents.list()
		setAgentList(updated)
		setSaveStatus('saved')
		setMode('menu')
		showSaved()
	}

	const handleProviderTypeSelect = (item: { value: string; label: string }) => {
		setSelectedProviderType(item.value)
		setMode('addProviderName')
	}

	const handleProviderNameSubmit = async (value: string) => {
		setSelectedProviderName(value)
		setMode('addProviderConfig')
	}

	const handleProviderConfigComplete = async (
		configValues: Record<string, string>,
	) => {
		providerForm.setSaveStatus('saving')

		// Convert string values to appropriate types based on schema
		const config: Record<string, unknown> = {}
		try {
			const schema = providerRegistry.schema(selectedProviderType)
			for (const [key, val] of Object.entries(configValues)) {
				const prop = schema.properties[key]
				if (prop && isTypedProperty(prop) && prop.type === 'number') {
					config[key] = val === '' ? undefined : Number(val)
				} else if (prop && isTypedProperty(prop) && prop.type === 'boolean') {
					config[key] = val === 'true'
				} else {
					config[key] = val
				}
			}
		} catch {
			// Schema not available, use raw values
			for (const [key, val] of Object.entries(configValues)) {
				config[key] = val
			}
		}

		await onUpsertProvider({
			name: selectedProviderName,
			type: selectedProviderType,
			config,
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
		setSaveStatus('saving')
		await onDeleteAgent(item.value)
		const updated = await agents.list()
		setAgentList(updated)
		setSaveStatus('removed')
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

	// Get the selected provider's type for overrides schema
	const selectedAgentProviderType = (() => {
		const prov = providerList.find((p) => p.id === agentValues.providerId)
		return prov?.type ?? ''
	})()

	const availableTools = toolRegistry.list()

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
					isFocused={saveStatus === 'idle'}
					onSelect={handleMenuSelect}
				/>
			)}

			{mode === 'addAgentName' && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Add agent</Text>
					<Box marginTop={1}>
						<Text>Name:</Text>
						<TextInput
							value={currentAgentInput}
							onChange={setCurrentAgentInput}
							onSubmit={handleAgentNameSubmit}
							focus={saveStatus === 'idle'}
						/>
					</Box>
				</Box>
			)}

			{mode === 'addAgentDescription' && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Add agent</Text>
					<Box marginTop={1} flexDirection="column">
						<Text dimColor>Name: {agentValues.name}</Text>
						<Box>
							<Text>Description (optional):</Text>
							<TextInput
								value={currentAgentInput}
								onChange={setCurrentAgentInput}
								onSubmit={handleAgentDescriptionSubmit}
								focus={saveStatus === 'idle'}
							/>
						</Box>
					</Box>
				</Box>
			)}

			{mode === 'addAgentPrompt' && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Add agent</Text>
					<Box marginTop={1} flexDirection="column">
						<Text dimColor>Name: {agentValues.name}</Text>
						<Box>
							<Text>System prompt:</Text>
							<TextInput
								value={currentAgentInput}
								onChange={setCurrentAgentInput}
								onSubmit={handleAgentPromptSubmit}
								focus={saveStatus === 'idle'}
							/>
						</Box>
					</Box>
				</Box>
			)}

			{mode === 'addAgentProvider' && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Select provider</Text>
					<SelectInput
						items={providerList.map((p) => ({
							label: p.name,
							value: p.id,
						}))}
						itemComponent={(item) => (
							<Box>
								<Text bold={item.isSelected ?? false}>{item.label}</Text>
							</Box>
						)}
						onSelect={handleAgentProviderSelect}
						isFocused={saveStatus === 'idle'}
					/>
				</Box>
			)}

			{mode === 'addAgentOverrides' && selectedAgentProviderType && (
				<SchemaDrivenForm
					title={`Provider overrides (${selectedAgentProviderType})`}
					schema={providerRegistry.schema(selectedAgentProviderType)}
					isFocused={saveStatus === 'idle'}
					onComplete={handleAgentOverridesComplete}
					onCancel={() => setMode('menu')}
				/>
			)}

			{mode === 'addAgentTools' && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Select tools (press Enter to toggle, Esc to finish)</Text>
					<SelectInput
						items={availableTools.map((t) => ({
							label: `${t.id} ${t.description ? `— ${t.description}` : ''}`,
							value: t.id,
						}))}
						itemComponent={(item) => (
							<Box>
								<Text bold={item.isSelected ?? false}>{item.label}</Text>
							</Box>
						)}
						onSelect={handleAgentToolsSelect}
						isFocused={saveStatus === 'idle'}
					/>
					<Box marginTop={1}>
						<Text dimColor>
							Selected: {agentValues.toolIds.join(', ') || 'none'}
						</Text>
					</Box>
				</Box>
			)}

			{mode === 'addProviderType' && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Select provider type</Text>
					<SelectInput
						items={AVAILABLE_PROVIDER_TYPES.map((t) => ({
							label: t,
							value: t,
						}))}
						itemComponent={(item) => (
							<Box>
								<Text bold={item.isSelected ?? false}>{item.label}</Text>
							</Box>
						)}
						onSelect={handleProviderTypeSelect}
						isFocused={providerForm.saveStatus === 'idle'}
					/>
				</Box>
			)}

			{mode === 'addProviderName' && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Provider name</Text>
					<Box>
						<Text>Name:</Text>
						<TextInput
							value={providerForm.currentFieldValue}
							onChange={(v) => providerForm.setCurrentFieldValue(v)}
							onSubmit={handleProviderNameSubmit}
							focus={providerForm.saveStatus === 'idle'}
						/>
					</Box>
				</Box>
			)}

			{mode === 'addProviderConfig' && selectedProviderType && (
				<SchemaDrivenForm
					title={`Configure ${selectedProviderType}`}
					schema={providerRegistry.schema(selectedProviderType)}
					isFocused={providerForm.saveStatus === 'idle'}
					onComplete={handleProviderConfigComplete}
					onCancel={() => setMode('menu')}
				/>
			)}

			{mode === 'removeAgent' && (
				<RemoveAgentList
					agents={agentList}
					isFocused={saveStatus === 'idle'}
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

			<SaveStatus status={saveStatus} />
			<Text dimColor>Esc to go back</Text>
		</Box>
	)
}
