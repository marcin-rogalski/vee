/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import * as Ink from 'ink'
import type React from 'react'
import type { Mock } from 'vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatScreen } from './ChatScreen.js'

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
			onSubmit={(e: React.SyntheticEvent) => {
				e.preventDefault()
				onSubmit(value)
			}}
			disabled={!focus}
		/>
	),
}))

const emptyAsyncGenerator = async function* () {}

describe('ChatScreen', () => {
	const mockStreamMessage = vi.fn()
	const mockStreamEvents = vi.fn().mockReturnValue(emptyAsyncGenerator())
	const mockOnBack = vi.fn()

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
		mockStreamEvents.mockReturnValue(emptyAsyncGenerator())
	})

	it('should render session title', async () => {
		const { getByText } = render(
			<ChatScreen
				streamMessage={mockStreamMessage}
				streamEvents={mockStreamEvents}
				sessionId="session-123"
				agentId="agent-1"
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Session: session-123')).toBeDefined()
		})
	})

	it('should render messages', async () => {
		const { getByText, getByTestId } = render(
			<ChatScreen
				streamMessage={mockStreamMessage}
				streamEvents={mockStreamEvents}
				sessionId="session-123"
				agentId="agent-1"
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			expect(getByText('Session: session-123')).toBeDefined()
		})

		const textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'Test message' } })
		fireEvent.submit(textInput)

		expect(mockStreamMessage).toHaveBeenCalledWith(
			'Test message',
			'agent-1',
			'session-123',
		)
	})

	it('should show streaming indicator after submitting a message', async () => {
		const streamEvents = [
			{ type: 'token' as const, content: 'Hello' },
			{ type: 'done' as const },
		]

		const mockGenerator = async function* () {
			for (const event of streamEvents) {
				yield event
			}
		}

		mockStreamEvents.mockReturnValue(mockGenerator())

		const { getByText, getByTestId } = render(
			<ChatScreen
				streamMessage={mockStreamMessage}
				streamEvents={mockStreamEvents}
				sessionId="session-123"
				agentId="agent-1"
				onBack={mockOnBack}
			/>,
		)

		const textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'Test message' } })
		fireEvent.submit(textInput)
		await waitFor(() => {
			expect(getByText('Streaming...')).toBeDefined()
		})
	})

	it('should call onBack when escape is pressed and input is empty', async () => {
		const useInputSpy = vi.fn(
			(callback: (_input: string, key: { escape?: boolean }) => void) => {
				callback('', { escape: true })
			},
		)
		vi.mocked(Ink.useInput as Mock).mockImplementation(useInputSpy)

		render(
			<ChatScreen
				streamMessage={mockStreamMessage}
				streamEvents={mockStreamEvents}
				sessionId="session-123"
				agentId="agent-1"
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			expect(mockOnBack).toHaveBeenCalled()
		})
	})

	it('should call streamMessage and streamEvents on form submit', async () => {
		const streamEvents = [
			{ type: 'token' as const, content: 'Hello' },
			{ type: 'token' as const, content: ' world' },
			{ type: 'done' as const },
		]

		const mockGenerator = async function* () {
			for (const event of streamEvents) {
				yield event
			}
		}

		mockStreamEvents.mockReturnValue(mockGenerator())

		const { getByTestId } = render(
			<ChatScreen
				streamMessage={mockStreamMessage}
				streamEvents={mockStreamEvents}
				sessionId="session-123"
				agentId="agent-1"
				onBack={mockOnBack}
			/>,
		)

		await waitFor(() => {
			const textInput = getByTestId('mock-text-input')
			fireEvent.change(textInput, { target: { value: 'Test message' } })
			fireEvent.submit(textInput)
		})

		expect(mockStreamMessage).toHaveBeenCalledWith(
			'Test message',
			'agent-1',
			'session-123',
		)
	})
})
