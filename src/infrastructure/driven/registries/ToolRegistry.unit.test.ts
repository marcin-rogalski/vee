import type ToolPort from '@application/ports/Tool.port'
import { beforeEach, describe, expect, it } from 'vitest'
import ToolRegistry from './ToolRegistry'

describe('R2 — ToolRegistry', () => {
	let registry: ToolRegistry

	beforeEach(() => {
		registry = new ToolRegistry()
	})

	it('registers a tool and retrieves it via get(id)', () => {
		const mockTool: ToolPort = {
			id: 'readFile',
			description: 'Read a file',
			definition: {
				name: 'readFile',
				description: 'Read a file',
				parameters: '{}',
			},
			execute: async () => ({ content: 'hello', code: undefined }),
		}
		registry.register(mockTool)
		const result = registry.get('readFile')
		expect(result.id).toBe('readFile')
		expect(result.description).toBe('Read a file')
	})

	it('throws Error when tool id not found', () => {
		expect(() => registry.get('nonexistent')).toThrow(
			'Tool with id nonexistent not found',
		)
	})

	it('list() returns array of { id, description } for all registered tools', () => {
		const tool1: ToolPort = {
			id: 'readFile',
			description: 'Read a file',
			definition: {
				name: 'readFile',
				description: 'Read a file',
				parameters: '{}',
			},
			execute: async () => ({ content: 'hello', code: undefined }),
		}
		const tool2: ToolPort = {
			id: 'writeFile',
			description: 'Write a file',
			definition: {
				name: 'writeFile',
				description: 'Write a file',
				parameters: '{}',
			},
			execute: async () => ({ content: 'ok', code: undefined }),
		}
		registry.register(tool1)
		registry.register(tool2)
		const result = registry.list()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(2)
		expect(result).toContainEqual({
			id: 'readFile',
			description: 'Read a file',
		})
		expect(result).toContainEqual({
			id: 'writeFile',
			description: 'Write a file',
		})
	})

	it('list() returns empty array when no tools registered', () => {
		const result = registry.list()
		expect(result).toEqual([])
	})

	it('overwriting a tool by same id replaces the previous one', () => {
		const tool1: ToolPort = {
			id: 'readFile',
			description: 'Old description',
			definition: {
				name: 'readFile',
				description: 'Old description',
				parameters: '{}',
			},
			execute: async () => ({ content: 'old', code: undefined }),
		}
		const tool2: ToolPort = {
			id: 'readFile',
			description: 'New description',
			definition: {
				name: 'readFile',
				description: 'New description',
				parameters: '{}',
			},
			execute: async () => ({ content: 'new', code: undefined }),
		}
		registry.register(tool1)
		registry.register(tool2)
		expect(registry.list()).toHaveLength(1)
		expect(registry.get('readFile').description).toBe('New description')
	})
})
