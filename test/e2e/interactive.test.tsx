/** @vitest-environment jsdom */
import { cleanup, render, waitFor } from '@testing-library/react'
import * as Ink from 'ink'
import type React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReplScreen } from '../../src/infrastructure/driving/screens/ReplScreen'

// Mock Ink components for jsdom rendering
vi.mock('ink', async () => {
	const actual = await vi.importActual<typeof Ink>('ink')
	return {
		...actual,
		default: actual,
		Box: ({
			children,
		}: {
			children?: React.ReactNode
			flexDirection?: 'row' | 'column'
			padding?: number
			marginTop?: number
			width?: number
			alignItems?: string
			justifyContent?: string
		}) => <div>{children}</div>,
		Text: ({
			children,
		}: {
			children?: React.ReactNode
			bold?: boolean
			color?: string
			dimColor?: boolean
		}) => <span>{children}</span>,
		useInput: vi.fn(),
		useStdout: vi.fn(() => ({
			stdout: { rows: 24, columns: 80 },
		})),
		useApp: vi.fn(() => ({
			exit: vi.fn(),
		})),
	}
})

vi.mock('ink-text-input', () => ({
	default: ({
		value,
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
			disabled={!focus}
		/>
	),
}))

vi.mock('ink-select-input', () => ({
	default: ({
		items,
	}: {
		items: { key: string; label: string }[]
		onSelect: (item: { key: string; label: string }) => void
	}) => <div data-testid="mock-select-input">{items.map((i) => i.label).join(', ')}</div>,
}))

const emptyAsyncGenerator = async function* () {}

describe('Interactive Mode', () => {
	const mockProps = {
		agentList: vi.fn().mockResolvedValue([]),
		agentUpsert: vi.fn().mockResolvedValue(undefined),
		agentDelete: vi.fn().mockResolvedValue(undefined),
		providerList: vi.fn().mockResolvedValue([]),
		providerUpsert: vi.fn().mockResolvedValue(undefined),
		providerDelete: vi.fn().mockResolvedValue(undefined),
		providerTypes: vi.fn().mockReturnValue(['openai']),
		providerSchema: vi.fn().mockReturnValue({
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			type: 'object',
			properties: {
				model: { type: 'string', description: 'Model name' },
			},
			required: ['model'],
		}),
		sessionList: vi.fn().mockResolvedValue([]),
		sessionCreate: vi.fn().mockResolvedValue('session-1'),
		sessionDelete: vi.fn().mockResolvedValue(undefined),
		streamMessage: vi.fn().mockResolvedValue(undefined),
		streamEvents: vi.fn().mockReturnValue(emptyAsyncGenerator()),
	}

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
		mockProps.streamEvents.mockReturnValue(emptyAsyncGenerator())
	})

	it('renders REPL with welcome message', async () => {
		const { getByText } = render(<ReplScreen {...mockProps} />)

		await waitFor(() => {
			expect(getByText('vee — AI agent REPL')).toBeDefined()
		})
	})

	it('renders REPL with help hint', async () => {
		const { getByText } = render(<ReplScreen {...mockProps} />)

		await waitFor(() => {
			expect(getByText('Type /help for available commands')).toBeDefined()
		})
	})
})
