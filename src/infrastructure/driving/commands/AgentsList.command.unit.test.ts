import type LoggerPort from '@application/ports/Logger.port'
import { describe, expect, it, vi } from 'vitest'
import { createAgentsListCommand } from './AgentsList.command'

describe('AgentsList.command', () => {
	const makeMockUseCase = () => ({
		execute: vi.fn().mockResolvedValue([
			{ id: 'a1', name: 'Coder', description: 'Coding agent' },
			{ id: 'a2', name: 'Writer', description: undefined },
		]),
	})

	const makeMockLogger = (): LoggerPort => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	})

	it('registers the list command with correct name and description', () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createAgentsListCommand({
			agentListUseCase: mockUseCase,
			logger: mockLogger,
		})

		expect(command.name()).toBe('list')
		expect(command.description()).toBe('List all agents')
	})

	it('calls usecase and logs each agent', async () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createAgentsListCommand({
			agentListUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync(['node', 'test'])

		expect(mockUseCase.execute).toHaveBeenCalled()
		expect(mockLogger.info).toHaveBeenCalledWith('Agents')
		expect(mockLogger.info).toHaveBeenCalledWith('a1 - Coder - Coding agent')
		expect(mockLogger.info).toHaveBeenCalledWith('a2 - Writer')
	})

	it('shows "No agents found" when list is empty', async () => {
		const mockUseCase = {
			execute: vi.fn().mockResolvedValue([]),
		}
		const mockLogger = makeMockLogger()

		const command = createAgentsListCommand({
			agentListUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync(['node', 'test'])

		expect(mockUseCase.execute).toHaveBeenCalled()
		expect(mockLogger.info).toHaveBeenCalledWith('No agents found')
	})
})
