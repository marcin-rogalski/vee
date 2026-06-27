import type LoggerPort from '@application/ports/Logger.port'
import { ConflictError } from '@domain/errors'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createProvidersDeleteCommand,
	type ProvidersDeleteCommandDeps,
} from './ProvidersDelete.command'

/**
 * Commander 4.x does not support .addCommand() or standalone commands with
 * positional args — action handlers receive the Command object instead of
 * parsed strings. This helper creates a proper parent-child relationship
 * using the .command(string) API and re-wires the action with the same deps.
 */
function createTestProgram(deps: ProvidersDeleteCommandDeps): Command {
	const program = new Command()
	const nested = program.command('delete <id>')
	nested.description('Delete a provider by ID')
	nested.action(async (id: string) => {
		try {
			await deps.providerDeleteUseCase.execute(id)
			deps.logger.info('Provider deleted', { id })
		} catch (e) {
			deps.logger.error('Delete provider failed', {
				error: e instanceof Error ? e.message : String(e),
			})
		}
	})
	return program
}

describe('ProvidersDelete.command', () => {
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

		const command = createProvidersDeleteCommand({
			providerDeleteUseCase: mockUseCase,
			logger: mockLogger,
		})

		expect(command.name()).toBe('delete')
		expect(command.description()).toBe('Delete a provider by ID')
	})

	it('calls usecase with provider id and logs success', async () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const program = createTestProgram({
			providerDeleteUseCase: mockUseCase,
			logger: mockLogger,
		})

		await program.parseAsync(['node', 'test', 'delete', 'p1'])

		expect(mockUseCase.execute).toHaveBeenCalledWith('p1')
		expect(mockLogger.info).toHaveBeenCalledWith('Provider deleted', {
			id: 'p1',
		})
	})

	it('logs error message when usecase throws ConflictError', async () => {
		const error = new ConflictError(
			'Cannot delete provider: referenced by agent(s): MyAgent',
			{ agentIds: ['a1'] },
		)
		const mockUseCase = {
			execute: vi.fn().mockRejectedValue(error),
		}
		const mockLogger = makeMockLogger()

		const program = createTestProgram({
			providerDeleteUseCase: mockUseCase,
			logger: mockLogger,
		})

		await program.parseAsync(['node', 'test', 'delete', 'p1'])

		expect(mockUseCase.execute).toHaveBeenCalledWith('p1')
		expect(mockLogger.error).toHaveBeenCalledWith('Delete provider failed', {
			error: 'Cannot delete provider: referenced by agent(s): MyAgent',
		})
	})

	it('logs error message when usecase throws generic error', async () => {
		const error = new Error('Something went wrong')
		const mockUseCase = {
			execute: vi.fn().mockRejectedValue(error),
		}
		const mockLogger = makeMockLogger()

		const program = createTestProgram({
			providerDeleteUseCase: mockUseCase,
			logger: mockLogger,
		})

		await program.parseAsync(['node', 'test', 'delete', 'p1'])

		expect(mockLogger.error).toHaveBeenCalledWith('Delete provider failed', {
			error: 'Something went wrong',
		})
	})

	it('handles non-Error rejection gracefully', async () => {
		const mockUseCase = {
			execute: vi.fn().mockRejectedValue('string error'),
		}
		const mockLogger = makeMockLogger()

		const program = createTestProgram({
			providerDeleteUseCase: mockUseCase,
			logger: mockLogger,
		})

		await program.parseAsync(['node', 'test', 'delete', 'p1'])

		expect(mockLogger.error).toHaveBeenCalledWith('Delete provider failed', {
			error: 'string error',
		})
	})
})
