import type LoggerPort from '@application/ports/Logger.port'
import { describe, expect, it, vi } from 'vitest'
import { createProvidersListCommand } from './ProvidersList.command'

describe('ProvidersList.command', () => {
	const makeMockUseCase = () => ({
		execute: vi.fn().mockResolvedValue([
			{ id: 'p1', name: 'OpenAI' },
			{ id: 'p2', name: 'Anthropic' },
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

		const command = createProvidersListCommand({
			providerListUseCase: mockUseCase,
			logger: mockLogger,
		})

		expect(command.name()).toBe('list')
		expect(command.description()).toBe('List all providers')
	})

	it('calls usecase and logs each provider', async () => {
		const mockUseCase = makeMockUseCase()
		const mockLogger = makeMockLogger()

		const command = createProvidersListCommand({
			providerListUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync(['node', 'test'])

		expect(mockUseCase.execute).toHaveBeenCalled()
		expect(mockLogger.info).toHaveBeenCalledWith('Providers')
		expect(mockLogger.info).toHaveBeenCalledWith('p1 - OpenAI')
		expect(mockLogger.info).toHaveBeenCalledWith('p2 - Anthropic')
	})

	it('shows "No providers found" when list is empty', async () => {
		const mockUseCase = {
			execute: vi.fn().mockResolvedValue([]),
		}
		const mockLogger = makeMockLogger()

		const command = createProvidersListCommand({
			providerListUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync(['node', 'test'])

		expect(mockUseCase.execute).toHaveBeenCalled()
		expect(mockLogger.info).toHaveBeenCalledWith('No providers found')
	})

	it('logs providers in order returned by usecase', async () => {
		const mockUseCase = {
			execute: vi.fn().mockResolvedValue([
				{ id: 'a', name: 'First' },
				{ id: 'b', name: 'Second' },
				{ id: 'c', name: 'Third' },
			]),
		}
		const mockLogger = makeMockLogger()

		const command = createProvidersListCommand({
			providerListUseCase: mockUseCase,
			logger: mockLogger,
		})

		await command.parseAsync(['node', 'test'])

		const infoCalls = (mockLogger.info as ReturnType<typeof vi.fn>).mock.calls
		expect(infoCalls[0]).toEqual(['Providers'])
		expect(infoCalls[1]).toEqual(['a - First'])
		expect(infoCalls[2]).toEqual(['b - Second'])
		expect(infoCalls[3]).toEqual(['c - Third'])
	})
})
