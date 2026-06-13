import { cleanup, fireEvent, render } from '@testing-library/react'
import React from 'react'
import type { Mock } from 'vitest'
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
			onSubmit={(e: React.FormEvent<HTMLInputElement>) => {
				e.preventDefault()
				onSubmit(value)
			}}
			disabled={!focus}
		/>
	),
}))

vi.mock('react', async (importOriginal) => {
	const actual: Record<string, unknown> = await importOriginal()
	return {
		...(actual as Record<string, unknown>),
		useEffect: vi.fn(),
		useState: vi.fn(),
	}
})

describe('ConfigScreen', () => {
	const mockAgentsList = vi.fn().mockResolvedValue([])
	const mockOnUpsert = vi.fn().mockResolvedValue(undefined)
	const mockOnDelete = vi.fn().mockResolvedValue(undefined)
	const mockSessionsList = vi.fn().mockResolvedValue([])
	const mockOnCreateSession = vi.fn().mockResolvedValue('session-1')
	const mockOnBack = vi.fn()

	afterEach(() => {
		cleanup()
		vi.resetAllMocks()
	})

	it('should render loading state', () => {
		;(vi.spyOn(React, 'useState') as Mock).mockImplementation(
			(initialValue: unknown) => {
				return [initialValue, () => {}]
			},
		)

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				onUpsert={mockOnUpsert}
				onDelete={mockOnDelete}
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				onBack={mockOnBack}
			/>,
		)
		expect(getByText('Loading...')).toBeDefined()
	})

	it('should render config title', () => {
		const mockAgents = [
			{ id: 'agent-1', name: 'Agent 1', description: 'Test agent' },
		]
		mockAgentsList.mockResolvedValue(mockAgents)

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				onUpsert={mockOnUpsert}
				onDelete={mockOnDelete}
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				onBack={mockOnBack}
			/>,
		)
		expect(getByText('Config')).toBeDefined()
	})

	it('should display agents count', () => {
		const mockAgents = [
			{ id: 'agent-1', name: 'Agent 1' },
			{ id: 'agent-2', name: 'Agent 2' },
		]
		mockAgentsList.mockResolvedValue(mockAgents)

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				onUpsert={mockOnUpsert}
				onDelete={mockOnDelete}
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				onBack={mockOnBack}
			/>,
		)
		expect(getByText('Agents: 2')).toBeDefined()
	})

	it('should call onBack when escape is pressed', () => {
		const useInputSpy = vi.fn(
			(
				_input: string,
				_key: { escape?: boolean },
				callback: (key: { escape?: boolean }) => void,
			) => {
				callback({ escape: true })
			},
		)

		const mockAgents = [{ id: 'agent-1', name: 'Agent 1' }]
		mockAgentsList.mockResolvedValue(mockAgents)

		const { unmount } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				onUpsert={mockOnUpsert}
				onDelete={mockOnDelete}
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				onBack={mockOnBack}
			/>,
		)
		expect(useInputSpy).toHaveBeenCalled()
		expect(mockOnBack).toHaveBeenCalled()

		unmount()
	})

	it('should show menu items', () => {
		const mockAgents = [{ id: 'agent-1', name: 'Agent 1' }]
		mockAgentsList.mockResolvedValue(mockAgents)

		const { getByText } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				onUpsert={mockOnUpsert}
				onDelete={mockOnDelete}
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				onBack={mockOnBack}
			/>,
		)
		expect(getByText('Add agent')).toBeDefined()
		expect(getByText('Remove agent')).toBeDefined()
		expect(getByText('Back')).toBeDefined()
	})

	it('should handle adding a new agent', async () => {
		const mockAgents = [{ id: 'agent-1', name: 'Agent 1' }]
		const updatedAgents = [...mockAgents, { id: 'agent-2', name: 'New Agent' }]
		mockAgentsList
			.mockResolvedValueOnce(mockAgents)
			.mockResolvedValueOnce(updatedAgents)

		const { getByTestId } = render(
			<ConfigScreen
				agents={{ list: mockAgentsList }}
				onUpsert={mockOnUpsert}
				onDelete={mockOnDelete}
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				onBack={mockOnBack}
			/>,
		)

		// Simulate form submission
		const textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'New Agent' } })
		fireEvent.submit(textInput)

		expect(mockOnUpsert).toHaveBeenCalledWith({ name: 'New Agent' })
	})
})
