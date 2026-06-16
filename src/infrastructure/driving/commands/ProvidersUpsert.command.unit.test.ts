import type LoggerPort from '@application/ports/Logger.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import type { JsonSchemaObject } from '@domain/JsonSchema'
import type Provider from '@domain/Provider'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProvidersUpsertCommand } from './ProvidersUpsert.command'

describe('ProvidersUpsert.command', () => {
	let executeMock: ReturnType<typeof vi.fn>
	let mockUseCase: { execute: (provider: Provider) => Promise<void> }
	let mockProviderRegistry: ProviderRegistryPort
	let mockLogger: LoggerPort
	let originalExit: typeof process.exit

	const testSchema: JsonSchemaObject = {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		type: 'object',
		properties: {
			apiKey: { type: 'string', description: 'API key' },
			model: { type: 'string', description: 'Model name' },
		},
		required: ['apiKey', 'model'],
	}

	beforeEach(() => {
		executeMock = vi.fn().mockResolvedValue(undefined)
		mockUseCase = {
			execute: executeMock as (provider: Provider) => Promise<void>,
		}
		mockProviderRegistry = {
			resolve: vi.fn(),
			schema: vi.fn().mockReturnValue(testSchema),
		}
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		}
		originalExit = process.exit
		process.exit = vi.fn() as never
	})

	afterEach(() => {
		process.exit = originalExit
	})

	it('registers the upsert command with correct options', () => {
		const command = createProvidersUpsertCommand({
			providerUpsertUseCase: mockUseCase,
			providerRegistry: mockProviderRegistry,
			logger: mockLogger,
		})

		expect(command.name()).toBe('upsert')
		expect(command.opts()).toBeDefined()
	})

	it('resolves configSchema from providerRegistry based on type', async () => {
		const command = createProvidersUpsertCommand({
			providerUpsertUseCase: mockUseCase,
			providerRegistry: mockProviderRegistry,
			logger: mockLogger,
		})

		const parsed = command.parseAsync.bind(command)([
			'node',
			'test',
			'--name',
			'MyAI',
			'--type',
			'openai',
		])

		await parsed

		expect(mockProviderRegistry.schema).toHaveBeenCalledWith('openai')
		expect(executeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				configSchema: testSchema,
			}),
		)
	})

	it('parses --config key=value pairs into config object', async () => {
		const command = createProvidersUpsertCommand({
			providerUpsertUseCase: mockUseCase,
			providerRegistry: mockProviderRegistry,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'MyAI',
			'--type',
			'openai',
			'--config',
			'apiKey=sk-test123',
			'--config',
			'model=gpt-4o',
		])

		expect(executeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				config: {
					apiKey: 'sk-test123',
					model: 'gpt-4o',
				},
			}),
		)
	})

	it('passes provider name and type to usecase', async () => {
		const command = createProvidersUpsertCommand({
			providerUpsertUseCase: mockUseCase,
			providerRegistry: mockProviderRegistry,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'MyAI',
			'--type',
			'openai',
		])

		expect(executeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'MyAI',
				type: 'openai',
			}),
		)
	})

	it('passes id option for updates', async () => {
		const command = createProvidersUpsertCommand({
			providerUpsertUseCase: mockUseCase,
			providerRegistry: mockProviderRegistry,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'MyAI',
			'--type',
			'openai',
			'--id',
			'p1',
		])

		expect(executeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'p1',
			}),
		)
	})

	it('exits with error on invalid config format (missing =)', async () => {
		const command = createProvidersUpsertCommand({
			providerUpsertUseCase: mockUseCase,
			providerRegistry: mockProviderRegistry,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'MyAI',
			'--type',
			'openai',
			'--config',
			'invalidFormat',
		])

		expect(mockLogger.error).toHaveBeenCalledWith(
			'Invalid config format: "invalidFormat". Expected key=value',
		)
		expect(process.exit).toHaveBeenCalledWith(1)
	})

	it('handles multiple config options', async () => {
		const command = createProvidersUpsertCommand({
			providerUpsertUseCase: mockUseCase,
			providerRegistry: mockProviderRegistry,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'MyAI',
			'--type',
			'openai',
			'--config',
			'apiKey=sk-test',
			'--config',
			'model=gpt-4o',
			'--config',
			'temperature=0.7',
		])

		expect(executeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				config: {
					apiKey: 'sk-test',
					model: 'gpt-4o',
					temperature: '0.7',
				},
			}),
		)
	})

	it('logs success message after save', async () => {
		const command = createProvidersUpsertCommand({
			providerUpsertUseCase: mockUseCase,
			providerRegistry: mockProviderRegistry,
			logger: mockLogger,
		})

		await command.parseAsync([
			'node',
			'test',
			'--name',
			'MyAI',
			'--type',
			'openai',
		])

		expect(mockLogger.info).toHaveBeenCalledWith('Provider saved', {
			id: 'new',
		})
	})
})
