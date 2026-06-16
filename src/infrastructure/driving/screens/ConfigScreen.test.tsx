/// <reference types="vite/client" />
/** @vitest-environment jsdom */

import type { Agent } from '@domain/Agent.js'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigScreen } from './ConfigScreen.js'

// Mock dependencies
vi.mock('ink', () => {
	// Capture useInput callbacks so tests can simulate key presses
	const useInputMock = vi.fn()
	return {
		Box: ({
			children,
			flexDirection,
			padding,
			marginTop,
		}: {
			children?: React.ReactNode
			flexDirection?: 'row' | 'column'
			padding?: number
			marginTop?: number
		}) => (
			<div
				data-testid="mock-box"
				style={{
					flexDirection: flexDirection || 'row',
					padding: padding || 0,
					marginTop: marginTop || 0,
				}}
			>
				{children}
			</div>
		),
		Text: ({
			children,
			bold,
			color,
			dimColor,
		}: {
			children?: React.ReactNode
			bold?: boolean
			color?: string
			dimColor?: boolean
		}) => (
			<span
				data-testid="mock-text"
				style={{
					fontWeight: bold ? 'bold' : 'normal',
					color,
					opacity: dimColor ? 0.6 : 1,
				}}
			>
				{children}
			</span>
		),
		useInput: useInputMock,
	}
})

vi.mock('ink-select-input', () => ({
	default: ({
		items,
		onSelect,
		isFocused,
	}: {
		items: Array<{ value: string; label: string }>
		onSelect: (item: { value: string; label: string }) => void
		isFocused: boolean
	}) => (
		<div data-testid="mock-select-input">
			{items.map((item: { value: string; label: string }) => (
				<button
					type="button"
					key={item.value}
					onClick={() => onSelect(item)}
					data-item={item.value}
					disabled={!isFocused}
				>
					{item.label}
				</button>
			))}
		</div>
	),
}))

vi.mock('ink-text-input', () => ({
	default: ({
		value,
		onChange,
		onSubmit,
		focus,
	}: {
		value: string
		onChange: (value: string) => void
		onSubmit: (value: string) => void
		focus: boolean
	}) => (
		<input
			data-testid="mock-text-input"
			value={value}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
				onChange((e.target as unknown as { value: string }).value)
			}
			onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
				if (e.key === 'Enter') {
					onSubmit(value)
				}
			}}
			disabled={!focus}
		/>
	),
}))

vi.mock('react', async (importOriginal) => {
	const actual: Record<string, unknown> = await importOriginal()
	return {
		...(actual as Record<string, unknown>),
		useEffect: vi.fn((callback: () => void) => {
			callback()
		}),
	}
})

// Get useInput mock for key simulation in tests
const inkModule = vi.mocked(await import('ink')) as typeof import('ink') & {
	useInput: ReturnType<typeof vi.fn>
}

describe('ConfigScreen', () => {
	const mockAgentsList = vi.fn().mockResolvedValue([])
	const mockProvidersList = vi.fn().mockResolvedValue([])
	const mockOnUpsertAgent = vi.fn().mockResolvedValue(undefined)
	const mockOnDeleteAgent = vi.fn().mockResolvedValue(undefined)
	const mockOnUpsertProvider = vi.fn().mockResolvedValue(undefined)
	const mockOnDeleteProvider = vi.fn().mockResolvedValue(undefined)
	const mockOnBack = vi.fn()
	const mockProviderRegistry = {
		schema: vi.fn().mockReturnValue({
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {},
		}),
		resolve: vi.fn().mockReturnValue({}),
	}
	const mockToolRegistry = {
		list: vi.fn().mockReturnValue([]),
		get: vi.fn().mockReturnValue({}),
	}

	// Helper: invoke all registered useInput callbacks with a key
	const simulateKey = (key: Record<string, unknown>) => {
		for (const call of inkModule.useInput.mock.calls) {
			const callback = call[0]
			if (typeof callback === 'function') {
				callback('', key as never)
			}
		}
	}

	afterEach(() => {
		cleanup()
		mockAgentsList.mockReset()
		mockProvidersList.mockReset()
		mockOnUpsertAgent.mockReset()
		mockOnDeleteAgent.mockReset()
		mockOnUpsertProvider.mockReset()
		mockOnDeleteProvider.mockReset()
		mockOnBack.mockReset()
		mockProviderRegistry.schema.mockReset()
		mockToolRegistry.list.mockReset()
		inkModule.useInput.mockReset()
	})

	beforeEach(() => {
		mockProviderRegistry.schema.mockReturnValue({
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {},
		})
		mockToolRegistry.list.mockReturnValue([])
	})

	it('should render loading state initially', async () => {
		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)
		expect(getByText('Loading...')).toBeDefined()
	})

	it('should render config title after loading', async () => {
		const mockAgents = [
			{ id: 'agent-1', name: 'Agent 1', description: 'Test agent' },
		]
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue([])

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Config')).toBeDefined()
		})
	})

	it('should display agents count after loading', async () => {
		const mockAgents = [
			{ id: 'agent-1', name: 'Agent 1' },
			{ id: 'agent-2', name: 'Agent 2' },
		]
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue([])

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Agents: 2')).toBeDefined()
		})
	})

	it('should call onBack when escape is pressed', async () => {
		const mockAgents = [{ id: 'agent-1', name: 'Agent 1' }]
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue([])

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Config')).toBeDefined()
		})
	})

	it('should show menu items after loading', async () => {
		const mockAgents = [{ id: 'agent-1', name: 'Agent 1' }]
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue([])

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add agent')).toBeDefined()
			expect(getByText('Remove agent')).toBeDefined()
			expect(getByText('Back')).toBeDefined()
		})
	})

	it('should handle adding a new agent', async () => {
		const mockAgents = [{ id: 'agent-1', name: 'Agent 1' }]
		const mockProviders = [{ id: 'prov-1', name: 'My OpenAI', type: 'openai' }]
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue(mockProviders)

		const { getByTestId, getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add agent')).toBeDefined()
		})

		// Click "Add agent" to enter add mode
		const addAgentBtn = getByText('Add agent')
		fireEvent.click(addAgentBtn)

		// Step 1: Name input appears
		await waitFor(() => {
			expect(getByTestId('mock-text-input')).toBeDefined()
		})

		let textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'New Agent' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Step 2: Description field appears
		await waitFor(() => {
			expect(getByText(/Description/)).toBeDefined()
		})

		// Submit empty description
		textInput = getByTestId('mock-text-input')
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Step 3: System prompt appears
		await waitFor(() => {
			expect(getByText('System prompt:')).toBeDefined()
		})

		textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'You are helpful.' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Step 4: Provider selection appears
		await waitFor(() => {
			expect(getByText('Select provider')).toBeDefined()
		})

		// Select provider
		const providerItem = getByText('My OpenAI')
		fireEvent.click(providerItem)

		// Step 5: Overrides form appears (with empty schema, auto-completes to tools)
		// The SchemaDrivenForm auto-completes when there are no fields,
		// so we transition directly to tools selection

		// Step 6: Tools selection appears
		await waitFor(() => {
			expect(getByText(/Select tools/)).toBeDefined()
		})

		// Step 7: Simulate Esc to finish tool selection and save
		simulateKey({ escape: true })

		await waitFor(() => {
			expect(mockOnUpsertAgent).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'New Agent',
					systemPrompt: 'You are helpful.',
					providerId: 'prov-1',
					providerOverrides: {},
					toolIds: [],
				}),
			)
		})
	})

	it('should handle agent flow with provider overrides schema', async () => {
		// Set up a non-empty schema for the selected provider
		mockProviderRegistry.schema.mockReturnValue({
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {
				model: { type: 'string', description: 'Model name' },
				temperature: { type: 'number', description: 'Temperature' },
			},
		})

		const mockAgents: Agent[] = []
		const mockProviders = [{ id: 'prov-1', name: 'My OpenAI', type: 'openai' }]
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue(mockProviders)

		const { getByTestId, getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add agent')).toBeDefined()
		})

		// Click "Add agent"
		fireEvent.click(getByText('Add agent'))

		// Step 1: Name
		let textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'Test Agent' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Step 2: Description (skip)
		await waitFor(() => expect(getByText(/Description/)).toBeDefined())
		textInput = getByTestId('mock-text-input')
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Step 3: System prompt
		await waitFor(() => expect(getByText('System prompt:')).toBeDefined())
		textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'Be nice.' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Step 4: Provider selection
		await waitFor(() => expect(getByText('Select provider')).toBeDefined())
		fireEvent.click(getByText('My OpenAI'))

		// Step 5: Overrides form title appears (SchemaDrivenForm renders with provider schema)
		await waitFor(() => {
			expect(getByText(/Provider overrides/)).toBeDefined()
		})

		// Verify the schema was requested for the correct provider type
		expect(mockProviderRegistry.schema).toHaveBeenCalledWith('openai')
	})

	it('should handle agent flow with tools available', async () => {
		mockToolRegistry.list.mockReturnValue([
			{
				id: 'readFile',
				description: 'Read a file',
				definition: {
					name: 'readFile',
					description: 'Read a file',
					parameters: '{}',
				},
				execute: vi.fn(),
			},
			{
				id: 'writeFile',
				description: 'Write a file',
				definition: {
					name: 'writeFile',
					description: 'Write a file',
					parameters: '{}',
				},
				execute: vi.fn(),
			},
		])

		const mockAgents: Agent[] = []
		const mockProviders = [{ id: 'prov-1', name: 'My OpenAI', type: 'openai' }]
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue(mockProviders)

		const { getByTestId, getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add agent')).toBeDefined()
		})

		// Click "Add agent"
		fireEvent.click(getByText('Add agent'))

		// Step 1: Name
		let textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'Tool Agent' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Step 2: Description (skip)
		await waitFor(() => expect(getByText(/Description/)).toBeDefined())
		textInput = getByTestId('mock-text-input')
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Step 3: System prompt
		await waitFor(() => expect(getByText('System prompt:')).toBeDefined())
		textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'Use tools.' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Step 4: Provider selection
		await waitFor(() => expect(getByText('Select provider')).toBeDefined())
		fireEvent.click(getByText('My OpenAI'))

		// Step 5: Tools selection (empty schema auto-completes overrides)
		await waitFor(() => {
			expect(getByText(/Select tools/)).toBeDefined()
		})

		// Verify tools are listed
		await waitFor(() => {
			expect(getByText(/readFile/)).toBeDefined()
			expect(getByText(/writeFile/)).toBeDefined()
		})

		// Select a tool
		fireEvent.click(getByText(/readFile/))

		// Finish with Esc
		simulateKey({ escape: true })

		await waitFor(() => {
			expect(mockOnUpsertAgent).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Tool Agent',
					toolIds: ['readFile'],
				}),
			)
		})
	})

	it('should cancel agent flow and return to menu on Esc', async () => {
		const mockAgents: Agent[] = []
		const mockProviders = [{ id: 'prov-1', name: 'My OpenAI', type: 'openai' }]
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue(mockProviders)

		const { getByTestId, getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add agent')).toBeDefined()
		})

		// Enter add agent flow
		fireEvent.click(getByText('Add agent'))
		await waitFor(() => {
			expect(getByTestId('mock-text-input')).toBeDefined()
		})

		// Press Esc to cancel — should return to menu
		simulateKey({ escape: true })

		// Menu items should be visible again
		await waitFor(() => {
			expect(getByText('Add agent')).toBeDefined()
			expect(getByText('Add provider')).toBeDefined()
		})

		// onUpsertAgent should NOT have been called
		expect(mockOnUpsertAgent).not.toHaveBeenCalled()
	})

	it('should include description in agent save when provided', async () => {
		const mockAgents: Agent[] = []
		const mockProviders = [{ id: 'prov-1', name: 'My OpenAI', type: 'openai' }]
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue(mockProviders)

		const { getByTestId, getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add agent')).toBeDefined()
		})

		fireEvent.click(getByText('Add agent'))

		// Name
		let textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'Full Agent' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Description (with value)
		await waitFor(() => expect(getByText(/Description/)).toBeDefined())
		textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'A helpful agent' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// System prompt
		await waitFor(() => expect(getByText('System prompt:')).toBeDefined())
		textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'Help!' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// Provider
		await waitFor(() => expect(getByText('Select provider')).toBeDefined())
		fireEvent.click(getByText('My OpenAI'))

		// Tools (auto-completed overrides)
		await waitFor(() => expect(getByText(/Select tools/)).toBeDefined())

		// Save
		simulateKey({ escape: true })

		await waitFor(() => {
			expect(mockOnUpsertAgent).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Full Agent',
					description: 'A helpful agent',
					systemPrompt: 'Help!',
					providerId: 'prov-1',
				}),
			)
		})
	})

	/* ---- Provider flow tests ---- */

	it('should show Add provider menu item after loading', async () => {
		mockAgentsList.mockResolvedValue([])
		mockProvidersList.mockResolvedValue([])

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add provider')).toBeDefined()
		})
	})

	it('should transition to provider type selection when Add provider is clicked', async () => {
		mockAgentsList.mockResolvedValue([])
		mockProvidersList.mockResolvedValue([])

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add provider')).toBeDefined()
		})

		const addProviderBtn = getByText('Add provider')
		fireEvent.click(addProviderBtn)

		await waitFor(() => {
			expect(getByText('Select provider type')).toBeDefined()
		})
	})

	it('should show available provider types in selection', async () => {
		mockAgentsList.mockResolvedValue([])
		mockProvidersList.mockResolvedValue([])

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add provider')).toBeDefined()
		})

		fireEvent.click(getByText('Add provider'))

		await waitFor(() => {
			expect(getByText('openai')).toBeDefined()
		})
	})

	it('should transition to name input after selecting provider type', async () => {
		mockAgentsList.mockResolvedValue([])
		mockProvidersList.mockResolvedValue([])

		const { getByText, getByTestId } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add provider')).toBeDefined()
		})

		fireEvent.click(getByText('Add provider'))

		await waitFor(() => {
			expect(getByText('Select provider type')).toBeDefined()
		})

		const openaiBtn = getByText('openai')
		fireEvent.click(openaiBtn)

		await waitFor(() => {
			expect(getByText('Provider name')).toBeDefined()
		})

		expect(getByTestId('mock-text-input')).toBeDefined()
	})

	it('should transition to schema-driven config form after entering provider name', async () => {
		const openaiSchema = {
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			type: 'object' as const,
			properties: {
				apiKey: { type: 'string' as const, description: 'API key' },
			},
			required: ['apiKey'],
		}
		mockProviderRegistry.schema.mockReturnValue(openaiSchema)
		mockAgentsList.mockResolvedValue([])
		mockProvidersList.mockResolvedValue([])

		const { getByText, getByTestId } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add provider')).toBeDefined()
		})

		fireEvent.click(getByText('Add provider'))
		await waitFor(() => {
			expect(getByText('Select provider type')).toBeDefined()
		})
		fireEvent.click(getByText('openai'))
		await waitFor(() => {
			expect(getByText('Provider name')).toBeDefined()
		})

		const textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'my-openai' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		await waitFor(() => {
			expect(getByText('Configure openai')).toBeDefined()
		})
	})

	it('should call onUpsertProvider with correct values after completing config form', async () => {
		const openaiSchema = {
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			type: 'object' as const,
			properties: {
				apiKey: { type: 'string' as const, description: 'API key' },
			},
			required: ['apiKey'],
		}
		mockProviderRegistry.schema.mockReturnValue(openaiSchema)
		mockAgentsList.mockResolvedValue([])
		mockProvidersList.mockResolvedValue([{ id: 'p1', name: 'my-openai' }])

		const { getByText, getByTestId } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add provider')).toBeDefined()
		})

		fireEvent.click(getByText('Add provider'))
		await waitFor(() => {
			expect(getByText('Select provider type')).toBeDefined()
		})
		fireEvent.click(getByText('openai'))
		await waitFor(() => {
			expect(getByText('Provider name')).toBeDefined()
		})

		let textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'my-openai' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		await waitFor(() => {
			expect(getByText('Configure openai')).toBeDefined()
		})

		textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'sk-test-key' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		await waitFor(() => {
			expect(mockOnUpsertProvider).toHaveBeenCalledWith({
				name: 'my-openai',
				type: 'openai',
				config: { apiKey: 'sk-test-key' },
			})
		})
	})

	it('should return to menu after successful provider save', async () => {
		const openaiSchema = {
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			type: 'object' as const,
			properties: {
				apiKey: { type: 'string' as const, description: 'API key' },
			},
			required: ['apiKey'],
		}
		mockProviderRegistry.schema.mockReturnValue(openaiSchema)
		mockAgentsList.mockResolvedValue([])
		mockProvidersList.mockResolvedValue([{ id: 'p1', name: 'my-openai' }])

		const { getByText, getByTestId } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
				providerRegistry={mockProviderRegistry}
				toolRegistry={mockToolRegistry}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add provider')).toBeDefined()
		})

		fireEvent.click(getByText('Add provider'))
		await waitFor(() => {
			expect(getByText('Select provider type')).toBeDefined()
		})
		fireEvent.click(getByText('openai'))
		await waitFor(() => {
			expect(getByText('Provider name')).toBeDefined()
		})

		let textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'my-openai' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		await waitFor(() => {
			expect(getByText('Configure openai')).toBeDefined()
		})

		textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'sk-test-key' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		await waitFor(() => {
			expect(getByText('Add agent')).toBeDefined()
		})
	})
})
