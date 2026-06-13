import { cleanup, fireEvent, render } from '@testing-library/react'
import React from 'react'
import type { Mock } from 'vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SessionScreen } from './SessionScreen.js'

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

vi.mock('react', async (importOriginal) => {
	const actual: Record<string, unknown> = await importOriginal()
	return {
		...(actual as Record<string, unknown>),
		useEffect: vi.fn(),
		useState: vi.fn(),
	}
})

describe('SessionScreen', () => {
	const mockSessionsList = vi.fn().mockResolvedValue([])
	const mockOnCreateSession = vi.fn().mockResolvedValue('session-1')
	const mockAgentsList = vi.fn().mockResolvedValue([])
	const mockOnSelectSession = vi.fn()
	const mockOnSelectAgent = vi.fn()
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
			<SessionScreen
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				agents={{ list: mockAgentsList }}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)
		expect(getByText('Loading...')).toBeDefined()
	})

	it('should render sessions list', () => {
		const mockSessions = [
			{ id: 'session-1', name: 'Session 1' },
			{ id: 'session-2', name: 'Session 2' },
		]
		mockSessionsList.mockResolvedValue(mockSessions)

		const { getByText } = render(
			<SessionScreen
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				agents={{ list: mockAgentsList }}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)
		expect(getByText('Session 1')).toBeDefined()
		expect(getByText('Session 2')).toBeDefined()
	})

	it('should display create new session option', () => {
		const { getByText } = render(
			<SessionScreen
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				agents={{ list: mockAgentsList }}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)
		expect(getByText('New session')).toBeDefined()
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

		const { unmount } = render(
			<SessionScreen
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				agents={{ list: mockAgentsList }}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)

		expect(useInputSpy).toHaveBeenCalled()
		expect(mockOnBack).toHaveBeenCalled()

		unmount()
	})

	it('should create new session and call onSelect', async () => {
		mockOnCreateSession.mockResolvedValue('new-session-id')

		const { getByTestId } = render(
			<SessionScreen
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				agents={{ list: mockAgentsList }}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)

		// Simulate selecting "New session" by clicking the first button
		const selectInput = getByTestId('mock-select-input') as HTMLElement
		const buttons = selectInput.querySelectorAll('button')
		if (buttons && buttons.length > 0 && buttons[0]) {
			fireEvent.click(buttons[0])
		}

		expect(mockOnCreateSession).toHaveBeenCalledWith('New Session')
		expect(mockOnSelectSession).toHaveBeenCalledWith('new-session-id')
	})

	it('should display agents list when available', () => {
		const mockAgents = [
			{ id: 'agent-1', name: 'Agent 1' },
			{ id: 'agent-2', name: 'Agent 2' },
		]
		mockAgentsList.mockResolvedValue(mockAgents)

		const { getByText } = render(
			<SessionScreen
				sessions={{ list: mockSessionsList }}
				onCreateSession={mockOnCreateSession}
				agents={{ list: mockAgentsList }}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)
		expect(getByText('Agent:')).toBeDefined()
		expect(getByText('Agent 1')).toBeDefined()
	})
})
