/**
 * Integration tests for CRUD flows with real JSON repositories.
 *
 * Uses isolated temp directories so each test gets a clean data store.
 */
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConsoleLogger from '@infrastructure/utilities/ConsoleLogger.adapter'
import InMemoryEventBus from '@infrastructure/utilities/InMemoryEventBus'
import JsonAgentRepository from '@infrastructure/driven/repositories/JsonAgentRepository'
import JsonProviderRepository from '@infrastructure/driven/repositories/JsonProviderRepository'
import JsonSessionRepository from '@infrastructure/driven/repositories/JsonSessionRepository'
import JsonContextRepository from '@infrastructure/driven/repositories/JsonContextRepository'
import JsonChatMessageRepository from '@infrastructure/driven/repositories/JsonChatMessageRepository'
import AgentUpsertUseCase from '@application/usecases/AgentUpsert.usecase'
import AgentListUseCase from '@application/usecases/AgentList.usecase'
import AgentDeleteUseCase from '@application/usecases/AgentDelete.usecase'
import ProviderUpsertUseCase from '@application/usecases/ProviderUpsert.usecase'
import ProviderListUseCase from '@application/usecases/ProviderList.usecase'
import ProviderDeleteUseCase from '@application/usecases/ProviderDelete.usecase'
import SessionCreateUseCase from '@application/usecases/SessionCreate.usecase'
import SessionListUseCase from '@application/usecases/SessionList.usecase'
import SessionDeleteUseCase from '@application/usecases/SessionDelete.usecase'
import ToolRegistry from '@infrastructure/driven/registries/ToolRegistry'
import SchemaValidationServiceAdapter from '@infrastructure/driven/services/SchemaValidationService.adapter'

// Suppress logger output in tests
const silentLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
}

describe('Integration — CRUD Flows', () => {
	let tempDir: string
	let agentRepo: JsonAgentRepository
	let providerRepo: JsonProviderRepository
	let sessionRepo: JsonSessionRepository
	let contextRepo: JsonContextRepository
	let chatMessageRepo: JsonChatMessageRepository
	let toolRegistry: ToolRegistry
	let eventBus: InMemoryEventBus
	let schemaValidationService: SchemaValidationServiceAdapter

	// Use cases
	let agentUpsert: AgentUpsertUseCase
	let agentList: AgentListUseCase
	let agentDelete: AgentDeleteUseCase
	let providerUpsert: ProviderUpsertUseCase
	let providerList: ProviderListUseCase
	let providerDelete: ProviderDeleteUseCase
	let sessionCreate: SessionCreateUseCase
	let sessionList: SessionListUseCase
	let sessionDelete: SessionDeleteUseCase

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vee-int-'))

		agentRepo = new JsonAgentRepository(
			path.join(tempDir, 'agents.json'),
			silentLogger,
		)
		providerRepo = new JsonProviderRepository(
			path.join(tempDir, 'providers.json'),
			silentLogger,
		)
		sessionRepo = new JsonSessionRepository(
			path.join(tempDir, 'sessions.json'),
			silentLogger,
		)
		contextRepo = new JsonContextRepository(
			path.join(tempDir, 'context.json'),
		)
		chatMessageRepo = new JsonChatMessageRepository(
			path.join(tempDir, 'chat-messages.json'),
			silentLogger,
		)
		toolRegistry = new ToolRegistry()
		eventBus = new InMemoryEventBus()
		schemaValidationService = new SchemaValidationServiceAdapter()

		// Wire use cases
		agentUpsert = new AgentUpsertUseCase(
			agentRepo,
			providerRepo,
			toolRegistry,
			eventBus,
		)
		agentList = new AgentListUseCase(agentRepo)
		agentDelete = new AgentDeleteUseCase(agentRepo, sessionRepo, eventBus)
		providerUpsert = new ProviderUpsertUseCase(
			providerRepo,
			eventBus,
			schemaValidationService,
		)
		providerList = new ProviderListUseCase(providerRepo)
		providerDelete = new ProviderDeleteUseCase(
			providerRepo,
			agentRepo,
			eventBus,
		)
		sessionCreate = new SessionCreateUseCase(sessionRepo, eventBus)
		sessionList = new SessionListUseCase(sessionRepo)
		sessionDelete = new SessionDeleteUseCase(
			sessionRepo,
			contextRepo,
			chatMessageRepo,
			eventBus,
		)
	})

	describe('Provider CRUD', () => {
		it('can create, list, and delete a provider', async () => {
			const providerData = {
				id: 'prov-1',
				name: 'Test Provider',
				type: 'openai',
				configSchema: {
					$schema: 'https://json-schema.org/draft/2020-12/schema',
					type: 'object',
					properties: {
						model: { type: 'string' },
						apiKey: { type: 'string' },
					},
				},
				config: { model: 'gpt-4o', apiKey: 'sk-test' },
			}

			await providerUpsert.execute(providerData)

			const list = await providerList.execute()
			expect(list).toHaveLength(1)
			expect(list[0].id).toBe('prov-1')
			expect(list[0].name).toBe('Test Provider')

			await providerDelete.execute('prov-1')

			const emptyList = await providerList.execute()
			expect(emptyList).toHaveLength(0)
		})

		it('validates provider config against schema', async () => {
			const providerData = {
				id: 'prov-2',
				name: 'Bad Provider',
				type: 'openai',
				configSchema: {
					$schema: 'https://json-schema.org/draft/2020-12/schema',
					type: 'object',
					properties: {
						model: { type: 'string' },
					},
					required: ['model'],
				},
				config: {}, // missing required 'model'
			}

			await expect(providerUpsert.execute(providerData)).rejects.toThrow()
		})
	})

	describe('Agent CRUD', () => {
		it('can create, list, and delete an agent', async () => {
			// Create provider first (agent references it)
			await providerUpsert.execute({
				id: 'prov-1',
				name: 'Test Provider',
				type: 'openai',
				configSchema: {
					$schema: 'https://json-schema.org/draft/2020-12/schema',
					type: 'object',
					properties: {},
				},
				config: {},
			})

			const agentData = {
				id: 'agent-1',
				name: 'Test Agent',
				description: 'A test agent',
				systemPrompt: 'You are helpful.',
				providerId: 'prov-1',
				providerOverrides: {},
				toolIds: [],
			}

			await agentUpsert.execute(agentData)

			const list = await agentList.execute()
			expect(list).toHaveLength(1)
			expect(list[0].id).toBe('agent-1')
			expect(list[0].name).toBe('Test Agent')

			await agentDelete.execute('agent-1')

			const emptyList = await agentList.execute()
			expect(emptyList).toHaveLength(0)
		})

		it('rejects agent with non-existent provider', async () => {
			const agentData = {
				id: 'agent-2',
				name: 'Bad Agent',
				systemPrompt: 'You are helpful.',
				providerId: 'non-existent',
				providerOverrides: {},
				toolIds: [],
			}

			await expect(agentUpsert.execute(agentData)).rejects.toThrow()
		})
	})

	describe('Session CRUD', () => {
		it('can create, list, and delete a session', async () => {
			const sessionId = await sessionCreate.execute('Test Session', 'agent-1')

			const list = await sessionList.execute()
			expect(list).toHaveLength(1)
			expect(list[0].id).toBe(sessionId)
			expect(list[0].name).toBe('Test Session')

			await sessionDelete.execute(sessionId)

			const emptyList = await sessionList.execute()
			expect(emptyList).toHaveLength(0)
		})

		it('creates session with auto-generated name', async () => {
			const sessionId = await sessionCreate.execute(undefined, 'agent-1')

			const list = await sessionList.execute()
			expect(list).toHaveLength(1)
			expect(list[0].name).toBeDefined()
		})
	})

	describe('Full flow: provider → agent → session', () => {
		it('creates a provider, agent, and session in sequence', async () => {
			// Step 1: Create provider
			await providerUpsert.execute({
				id: 'prov-1',
				name: 'OpenAI',
				type: 'openai',
				configSchema: {
					$schema: 'https://json-schema.org/draft/2020-12/schema',
					type: 'object',
					properties: {
						model: { type: 'string' },
						apiKey: { type: 'string' },
					},
				},
				config: { model: 'gpt-4o', apiKey: 'sk-test' },
			})

			// Step 2: Create agent referencing provider
			await agentUpsert.execute({
				id: 'agent-1',
				name: 'Assistant',
				systemPrompt: 'You are a helpful assistant.',
				providerId: 'prov-1',
				providerOverrides: {},
				toolIds: [],
			})

			// Step 3: Create session with agent
			const sessionId = await sessionCreate.execute(
				'My Session',
				'agent-1',
			)

			// Verify all exist
			const providers = await providerList.execute()
			const agents = await agentList.execute()
			const sessions = await sessionList.execute()

			expect(providers).toHaveLength(1)
			expect(agents).toHaveLength(1)
			expect(sessions).toHaveLength(1)
			expect(sessions[0].id).toBe(sessionId)
			expect(sessions[0].agentId).toBe('agent-1')
		})
	})
})
