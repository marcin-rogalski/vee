import { cleanup, fireEvent, render } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatScreen } from './ChatScreen.js'

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

interface TextInputProps {
	value: string
	onChange: (value: string) => void
	onSubmit: (value: string) => void
	focus: boolean
}

vi.mock('ink-text-input', () => ({
	default: ({ value, onChange, onSubmit, focus }: TextInputProps) => (
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

vi.mock('react', async (importOriginal) => {
	const actual: Record<string, unknown> = await importOriginal()
	return {
		...(actual as Record<string, unknown>),
		useEffect: vi.fn(),
		useRef: vi.fn(() => ({ current: true })),
		useState: vi.fn(),
	}
})

describe('ChatScreen', () => {
	const mockStreamMessage = vi.fn()
	const mockStreamEvents = vi.fn()
	const mockOnBack = vi.fn()

	afterEach(() => {
		cleanup()
		vi.resetAllMocks()
	})

	it('should render session title', () => {
		const { getByText } = render(
			<ChatScreen
				streamMessage={mockStreamMessage}
				streamEvents={mockStreamEvents}
				sessionId="session-123"
				agentId="agent-1"
				onBack={mockOnBack}
			/>,
		)
		expect(getByText('Session: session-123')).toBeDefined()
	})

	it('should render messages', () => {
		const mockMessages = [
			{ role: 'user' as const, content: 'Hello' },
			{ role: 'assistant' as const, content: 'Hi there' },
		]
		vi.spyOn(React, 'useState').mockImplementation(() => {
			return [mockMessages, vi.fn()]
		})

		const { getAllByText } = render(
			<ChatScreen
				streamMessage={mockStreamMessage}
				streamEvents={mockStreamEvents}
				sessionId="session-123"
				agentId="agent-1"
				onBack={mockOnBack}
			/>,
		)

		expect(getAllByText('Hello')).toBeDefined()
		expect(getAllByText('Hi there')).toBeDefined()
	})

	it('should show streaming indicator', () => {
		vi.spyOn(React, 'useState').mockImplementation(() => {
			return [{}, () => {}]
		})

		const { getByText } = render(
			<ChatScreen
				streamMessage={mockStreamMessage}
				streamEvents={mockStreamEvents}
				sessionId="session-123"
				agentId="agent-1"
				onBack={mockOnBack}
			/>,
		)

		expect(getByText('Streaming...')).toBeDefined()
	})

	it('should call onBack when escape is pressed and input is empty', () => {
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
			<ChatScreen
				streamMessage={mockStreamMessage}
				streamEvents={mockStreamEvents}
				sessionId="session-123"
				agentId="agent-1"
				onBack={mockOnBack}
			/>,
		)

		expect(useInputSpy).toHaveBeenCalled()
		expect(mockOnBack).toHaveBeenCalled()

		unmount()
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

		// Simulate form submission
		const textInput = getByTestId('mock-text-input')
		fireEvent.change(textInput, { target: { value: 'Test message' } })
		fireEvent.submit(textInput)

		// Verify streamMessage was called
		expect(mockStreamMessage).toHaveBeenCalledWith(
			'Test message',
			'agent-1',
			'session-123',
		)
	})
})
