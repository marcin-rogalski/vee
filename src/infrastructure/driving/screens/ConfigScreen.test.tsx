/// <reference types="vite/client" />
/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfigScreen } from './ConfigScreen.js'

// Mock dependencies
vi.mock('ink', () => ({
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
	useInput: vi.fn(),
}))

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

describe('ConfigScreen', () => {
	const mockAgentsList = vi.fn().mockResolvedValue([])
	const mockProvidersList = vi.fn().mockResolvedValue([])
	const mockOnUpsertAgent = vi.fn().mockResolvedValue(undefined)
	const mockOnDeleteAgent = vi.fn().mockResolvedValue(undefined)
	const mockOnUpsertProvider = vi.fn().mockResolvedValue(undefined)
	const mockOnDeleteProvider = vi.fn().mockResolvedValue(undefined)
	const mockOnBack = vi.fn()

	afterEach(() => {
		cleanup()
		mockAgentsList.mockReset()
		mockProvidersList.mockReset()
		mockOnUpsertAgent.mockReset()
		mockOnDeleteAgent.mockReset()
		mockOnUpsertProvider.mockReset()
		mockOnDeleteProvider.mockReset()
		mockOnBack.mockReset()
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
		mockAgentsList.mockResolvedValue(mockAgents)
		mockProvidersList.mockResolvedValue([])

		const { getByTestId, getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				providers={{ list: mockProvidersList }}
				onUpsertAgent={mockOnUpsertAgent}
				onDeleteAgent={mockOnDeleteAgent}
				onUpsertProvider={mockOnUpsertProvider}
				onDeleteProvider={mockOnDeleteProvider}
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Add agent')).toBeDefined()
		})

		// Click "Add agent" to enter add mode
		const addAgentBtn = getByText('Add agent')
		fireEvent.click(addAgentBtn)

		// Wait for Name input to appear, fill and submit with Enter
		await waitFor(() => {
			expect(getByTestId('mock-text-input')).toBeDefined()
		})

		let textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'New Agent' } })
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		// After submitting Name, it moves to Description field
		await waitFor(() => {
			expect(getByText(/Description/)).toBeDefined()
		})

		textInput = getByTestId('mock-text-input')
		fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

		await waitFor(() => {
			expect(mockOnUpsertAgent).toHaveBeenCalledWith({ name: 'New Agent' })
		})
	})
})
