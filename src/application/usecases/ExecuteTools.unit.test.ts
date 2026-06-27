/** biome-ignore-all lint/suspicious/noExplicitAny: test mocks require any casts */
import type ToolPort from '@application/ports/Tool.port'
import type { ConversationEntry } from '@domain/ConversationEntry'
import { isToolResult } from '@domain/ConversationEntry'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExecuteToolsUseCase from './ExecuteTools.usecase'

let mockTool: ToolPort
let mockToolMap: Map<string, ToolPort>
let useCase: ExecuteToolsUseCase

beforeEach(() => {
	mockTool = {
		id: 'tool-1',
		description: 'Test tool',
		definition: {
			name: 'test-tool',
			description: 'Test tool',
			parameters: '{}',
		},
		execute: vi.fn().mockResolvedValue({ content: 'tool result', code: 200 }),
	} as unknown as ToolPort

	mockToolMap = new Map([['test-tool', mockTool]])
	useCase = new ExecuteToolsUseCase()
})

describe('ExecuteToolsUseCase', () => {
	it('executes tool and returns result as ConversationEntry', async () => {
		const results = await useCase.execute(
			[{ name: 'test-tool', arguments: '{"key":"value"}' }],
			mockToolMap,
		)

		expect(results).toHaveLength(1)
		const entry = results[0] as ConversationEntry
		expect(entry.role).toBe('system')
		if (isToolResult(entry)) {
			expect(entry.name).toBe('test-tool')
		}
		expect(entry.content).toBe('tool result')
	})

	it('passes arguments to tool.execute', async () => {
		await useCase.execute(
			[{ name: 'test-tool', arguments: '{"path":"file.txt"}' }],
			mockToolMap,
		)

		expect(mockTool.execute).toHaveBeenCalledWith('{"path":"file.txt"}')
	})

	it('handles multiple tool calls in parallel', async () => {
		const mockTool2 = {
			id: 'tool-2',
			description: 'Another tool',
			definition: {
				name: 'another-tool',
				description: 'Another tool',
				parameters: '{}',
			},
			execute: vi
				.fn()
				.mockResolvedValue({ content: 'another result', code: 200 }),
		} as unknown as ToolPort

		mockToolMap.set('another-tool', mockTool2)

		const results = await useCase.execute(
			[
				{ name: 'test-tool', arguments: '{}' },
				{ name: 'another-tool', arguments: '{}' },
			],
			mockToolMap,
		)

		expect(results).toHaveLength(2)
		expect(mockTool.execute).toHaveBeenCalled()
		expect(mockTool2.execute).toHaveBeenCalled()
	})

	it('returns error entry when tool not found', async () => {
		const results = await useCase.execute(
			[{ name: 'unknown-tool', arguments: '{}' }],
			mockToolMap,
		)

		expect(results).toHaveLength(1)
		const entry = results[0] as ConversationEntry
		expect(entry.content).toContain('not found')
	})

	it('handles tool execution errors gracefully', async () => {
		mockTool.execute = vi.fn().mockRejectedValue(new Error('Tool failed'))

		const results = await useCase.execute(
			[{ name: 'test-tool', arguments: '{}' }],
			mockToolMap,
		)

		expect(results).toHaveLength(1)
		const entry = results[0] as ConversationEntry
		expect(entry.content).toContain('Error executing')
		expect(entry.content).toContain('Tool failed')
	})

	it('preserves order of results matching input order', async () => {
		const mockTool2 = {
			id: 'tool-2',
			description: 'Second tool',
			definition: {
				name: 'second-tool',
				description: 'Second tool',
				parameters: '{}',
			},
			execute: vi
				.fn()
				.mockResolvedValue({ content: 'second result', code: 200 }),
		} as unknown as ToolPort

		mockToolMap.set('second-tool', mockTool2)

		const results = await useCase.execute(
			[
				{ name: 'test-tool', arguments: '{}' },
				{ name: 'second-tool', arguments: '{}' },
			],
			mockToolMap,
		)

		expect(results).toHaveLength(2)
		const first = results[0]
		const second = results[1]
		if (first && isToolResult(first)) {
			expect(first.name).toBe('test-tool')
		}
		if (second && isToolResult(second)) {
			expect(second.name).toBe('second-tool')
		}
	})
})
