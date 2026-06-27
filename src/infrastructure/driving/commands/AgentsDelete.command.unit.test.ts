import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	type AgentsDeleteCommandDeps,
	createAgentsDeleteCommand,
} from './AgentsDelete.command'

function createTestProgram(deps: AgentsDeleteCommandDeps): Command {
	const program = new Command()
	const nested = program.command('delete <id>')
	nested.description('Delete an agent by ID')
	nested.action(async (id: string) => {
		try {
			await deps.agentDeleteUseCase.execute(id)
			deps.logger.info('Agent deleted', { id })
		} catch (e) {
			deps.logger.error('Delete agent failed', {
				error: e instanceof Error ? e.message : String(e),
			})
		}
	})
	return program
}

describe('AgentsDelete.command', () => {
	const makeMockUseCase = () => ({
		execute: vi.fn().mockResolvedValue(undefined),
	})

	const makeMockLogger = (): LoggerPort => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	})

	let originalExit: typeof process.exit

	beforeEach(() => {
		originalExit = process.exit
		process.exit = vi.fn() as never
	})

	afterEach(() => {
		process.exit = originalExit
	})

	it('registers the delete command with correct name and description', () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createAgentsDeleteCommand({
			agentDeleteUseCase: mockUseCase,
			logger: mockLogger,
		})

		expect(command.name()).toBe('delete')
		expect(command.description()).toBe('Delete an agent by ID')
	})

	it('calls usecase with agent ID and logs success', async () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const program = createTestProgram({
			agentDeleteUseCase: mockUseCase,
			logger: mockLogger,
		})

		await program.parseAsync(['node', 'test', 'delete', 'agent-123'])

		expect(mockUseCase.execute).toHaveBeenCalledWith('agent-123')
		expect(mockLogger.info).toHaveBeenCalledWith('Agent deleted', {
			id: 'agent-123',
		})
	})

	it('logs error when usecase throws', async () => {
		const mockUseCase = {
			execute: vi.fn().mockRejectedValue(new Error('Not found')),
		}
		const mockLogger = makeMockLogger()

		const program = createTestProgram({
			agentDeleteUseCase: mockUseCase,
			logger: mockLogger,
		})

		await program.parseAsync(['node', 'test', 'delete', 'agent-999'])

		expect(mockUseCase.execute).toHaveBeenCalledWith('agent-999')
		expect(mockLogger.error).toHaveBeenCalledWith('Delete agent failed', {
			error: 'Not found',
		})
	})
})
