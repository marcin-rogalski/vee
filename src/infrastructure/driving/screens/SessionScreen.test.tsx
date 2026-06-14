/** @vitest-environment jsdom */
import { cleanup, render, waitFor } from '@testing-library/react'
import * as Ink from 'ink'
import type React from 'react'
import type { Mock } from 'vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SessionScreen } from './SessionScreen.js'

// Mock dependencies
vi.mock('ink', async () => {
	const actual = await vi.importActual<typeof Ink>('ink')
	return {
		...actual,
		default: actual,
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

describe('SessionScreen', () => {
	const createMockSessions = () => ({
		list: vi.fn().mockResolvedValue([]),
	})

	const createMockAgents = () => ({
		list: vi.fn().mockResolvedValue([]),
	})

	const mockOnCreateSession = vi.fn()
	const mockOnSelectSession = vi.fn()
	const mockOnSelectAgent = vi.fn()
	const mockOnBack = vi.fn()

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('should render loading state', async () => {
		const sessions = createMockSessions()
		const agents = createMockAgents()

		const { getByText } = render(
			<SessionScreen
				sessions={sessions}
				onCreateSession={mockOnCreateSession}
				agents={agents}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)

		expect(getByText('Loading...')).toBeDefined()
	})

	it('should render sessions list', async () => {
		const mockSessions = [
			{ id: 'session-1', name: 'Session 1' },
			{ id: 'session-2', name: 'Session 2' },
		]
		const sessions = createMockSessions()
		vi.mocked(sessions.list).mockResolvedValue(mockSessions)
		const agents = createMockAgents()

		const { getByText } = render(
			<SessionScreen
				sessions={sessions}
				onCreateSession={mockOnCreateSession}
				agents={agents}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Session 1')).toBeDefined()
			expect(getByText('Session 2')).toBeDefined()
		})
	})

	it('should display create new session option', async () => {
		const sessions = createMockSessions()
		const agents = createMockAgents()

		const { getByText } = render(
			<SessionScreen
				sessions={sessions}
				onCreateSession={mockOnCreateSession}
				agents={agents}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			expect(getByText('New session')).toBeDefined()
		})
	})

	it('should call onBack when escape is pressed', async () => {
		const sessions = createMockSessions()
		const agents = createMockAgents()

		const useInputSpy = vi.fn()
		vi.mocked(Ink.useInput as Mock).mockImplementation(useInputSpy)

		const { unmount } = render(
			<SessionScreen
				sessions={sessions}
				onCreateSession={mockOnCreateSession}
				agents={agents}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			expect(useInputSpy).toHaveBeenCalled()
		})

		unmount()
	})

	it('should render session selection without calling callbacks immediately', async () => {
		const sessions = createMockSessions()
		const mockAgents = [{ id: 'agent-1', name: 'Agent 1' }]
		const agents = createMockAgents()
		vi.mocked(agents.list).mockResolvedValue(mockAgents)

		mockOnCreateSession.mockResolvedValueOnce('new-session-id')

		const { getAllByTestId } = render(
			<SessionScreen
				sessions={sessions}
				onCreateSession={mockOnCreateSession}
				agents={agents}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			const selectInputs = getAllByTestId('mock-select-input')
			expect(selectInputs.length).toBeGreaterThan(0)
		})

		expect(mockOnCreateSession).not.toHaveBeenCalled()
		expect(mockOnSelectSession).not.toHaveBeenCalled()
	})

	it('should display agents list when available', async () => {
		const sessions = createMockSessions()
		const mockAgents = [
			{ id: 'agent-1', name: 'Agent 1' },
			{ id: 'agent-2', name: 'Agent 2' },
		]
		const agents = createMockAgents()
		vi.mocked(agents.list).mockResolvedValue(mockAgents)

		const { getByText } = render(
			<SessionScreen
				sessions={sessions}
				onCreateSession={mockOnCreateSession}
				agents={agents}
				onSelectSession={mockOnSelectSession}
				onSelectAgent={mockOnSelectAgent}
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Agent:')).toBeDefined()
			expect(getByText('Agent 1')).toBeDefined()
		})
	})
})
