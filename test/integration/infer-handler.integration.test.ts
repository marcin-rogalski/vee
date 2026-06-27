/**
 * Integration tests for InferHandler with a deterministic mock provider.
 *
 * Verifies the full inference loop: resolve → persist → infer → loop.
 */
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type ProviderPort from '@application/ports/Provider.port'
import type { ProviderEvent } from '@application/ports/Provider.port'
import type { ConversationEntry } from '@domain/ConversationEntry'
import AgentUpsertUseCase from '@application/usecases/AgentUpsert.usecase'
import ProviderUpsertUseCase from '@application/usecases/ProviderUpsert.usecase'
import SessionCreateUseCase from '@application/usecases/SessionCreate.usecase'
import BuildContextUseCase from '@application/usecases/BuildContext.usecase'
import ExecuteToolsUseCase from '@application/usecases/ExecuteTools.usecase'
import InferTurnUseCase from '@application/usecases/InferTurn.usecase'
import InferHandler from '@infrastructure/driving/handlers/InferHandler'
import ProviderRegistry from '@infrastructure/driven/registries/ProviderRegistry'
import ToolRegistry from '@infrastructure/driven/registries/ToolRegistry'
import InMemoryEventBus from '@infrastructure/utilities/InMemoryEventBus'
import JsonAgentRepository from '@infrastructure/driven/repositories/JsonAgentRepository'
import JsonProviderRepository from '@infrastructure/driven/repositories/JsonProviderRepository'
import JsonSessionRepository from '@infrastructure/driven/repositories/JsonSessionRepository'
import JsonContextRepository from '@infrastructure/driven/repositories/JsonContextRepository'
import JsonChatMessageRepository from '@infrastructure/driven/repositories/JsonChatMessageRepository'
import ContextServiceAdapter from '@infrastructure/driven/services/ContextService.adapter'
import ChatMessageServiceAdapter from '@infrastructure/driven/services/ChatMessageService.adapter'
import SchemaValidationServiceAdapter from '@infrastructure/driven/services/SchemaValidationService.adapter'

// --- Silent logger ---
const silentLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
}

// --- Mock provider that returns deterministic responses ---
class MockProvider implements ProviderPort {
	id = 'mock-provider'
	type = 'mock'

	constructor(readonly responses: string[]) {}

	countTokens(_entry: ConversationEntry): number {
		return 1
	}

	async compact(
		context: readonly ConversationEntry[],
	): Promise<Array<ConversationEntry>> {
		return [...context]
	}

	shouldCompact(_context: readonly ConversationEntry[]): boolean {
		return false
	}

	async *infer(
		_configuration: Record<string, unknown>,
		_context: readonly ConversationEntry[],
		_tools: readonly unknown[],
	): AsyncGenerator<ProviderEvent> {
		const response = this.responses.shift() ?? 'No response'
		for (const char of response) {
			yield { type: 'token', content: char }
		}
	}
}

const MOCK_SCHEMA = {
	$schema: 'https://json-schema.org/draft/2020-12/schema',
	type: 'object',
	properties: {},
}

describe('Integration — InferHandler', () => {
	let tempDir: string
	let handler: InferHandler
	let eventBus: InMemoryEventBus
	let providerRegistry: ProviderRegistry
	let toolRegistry: ToolRegistry
	let mockProvider: MockProvider
	let sessionCreate: SessionCreateUseCase

	let agentId: string
	let sessionId: string

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vee-int-infer-'))

		// Repositories
		const agentRepo = new JsonAgentRepository(
			path.join(tempDir, 'agents.json'),
			silentLogger,
		)
		const providerRepo = new JsonProviderRepository(
			path.join(tempDir, 'providers.json'),
			silentLogger,
		)
		const sessionRepo = new JsonSessionRepository(
			path.join(tempDir, 'sessions.json'),
			silentLogger,
		)
		const contextRepo = new JsonContextRepository(
			path.join(tempDir, 'context.json'),
		)
		const chatMessageRepo = new JsonChatMessageRepository(
			path.join(tempDir, 'chat-messages.json'),
			silentLogger,
		)

		// Registries
		toolRegistry = new ToolRegistry()
		providerRegistry = new ProviderRegistry()
		eventBus = new InMemoryEventBus()

		// Services
		const contextService = new ContextServiceAdapter(contextRepo)
		const chatMessageService = new ChatMessageServiceAdapter(chatMessageRepo)
		const schemaValidationService = new SchemaValidationServiceAdapter()

		// Use cases
		const agentUpsert = new AgentUpsertUseCase(
			agentRepo,
			providerRepo,
			toolRegistry,
			eventBus,
		)
		const providerUpsert = new ProviderUpsertUseCase(
			providerRepo,
			eventBus,
			schemaValidationService,
		)
		sessionCreate = new SessionCreateUseCase(sessionRepo, eventBus)
		const buildContext = new BuildContextUseCase(contextService)

		// Handler
		handler = new InferHandler(
			agentRepo,
			providerRepo,
			providerRegistry,
			toolRegistry,
			contextService,
			chatMessageService,
			eventBus,
			buildContext,
			new ExecuteToolsUseCase(),
			(provider) => new InferTurnUseCase(provider),
		)

		// Create provider and agent
		agentId = ''
		sessionId = ''
	})

	it('streams a simple response end-to-end', async () => {
		// Register mock provider
		mockProvider = new MockProvider(['Hello, world!'])
		providerRegistry.register('mock', () => mockProvider, MOCK_SCHEMA)

		// Create provider entity
		await handler.providerRepository.save({
			id: 'prov-1',
			name: 'Mock',
			type: 'mock',
			configSchema: MOCK_SCHEMA,
			config: {},
		})

		// Create agent
		await handler.agentRepository.save({
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'prov-1',
			providerOverrides: {},
			toolIds: [],
		})
		agentId = 'agent-1'

		// Create session via use case
		sessionId = await sessionCreate.execute('Test Session', agentId)

		// Collect events from event bus
		const events: unknown[] = []
		const eventsGen = eventBus.subscribe()
		const drain = (async () => {
			for await (const e of eventsGen) {
				events.push(e)
			}
		})()

		// Execute inference
		await handler.execute('Say hello', agentId, sessionId)

		// Verify context was persisted
		const agent = await handler.agentRepository.get(agentId)
		const context = await handler.contextService.build(agent, sessionId)
		expect(context).toHaveLength(3) // system prompt + user + assistant
		expect(context[1].role).toBe('user')
		expect(context[1].content).toBe('Say hello')
		expect(context[2].role).toBe('assistant')
		expect(context[2].content).toBe('Hello, world!')

		// Verify chat message was persisted
		const messages = await handler.chatMessageService.getBySession(sessionId)
		expect(messages).toHaveLength(2)
		expect(messages[0].role).toBe('user')
		expect(messages[1].role).toBe('assistant')
	})

	it('persists multiple turns in context', async () => {
		// Register mock provider with two responses
		mockProvider = new MockProvider(['First response', 'Second response'])
		providerRegistry.register('mock', () => mockProvider, MOCK_SCHEMA)

		// Create provider entity
		await handler.providerRepository.save({
			id: 'prov-1',
			name: 'Mock',
			type: 'mock',
			configSchema: MOCK_SCHEMA,
			config: {},
		})

		// Create agent
		await handler.agentRepository.save({
			id: 'agent-1',
			name: 'Test Agent',
			systemPrompt: 'You are helpful.',
			providerId: 'prov-1',
			providerOverrides: {},
			toolIds: [],
		})
		agentId = 'agent-1'

		// Create session via use case
		sessionId = await sessionCreate.execute('Test Session', agentId)

		// Turn 1
		await handler.execute('Hello', agentId, sessionId)

		// Turn 2
		await handler.execute('How are you?', agentId, sessionId)

		// Context should have: system, user1, assistant1, user2, assistant2
		const agent = await handler.agentRepository.get(agentId)
		const context = await handler.contextService.build(agent, sessionId)
		expect(context).toHaveLength(5)
		expect(context[1].content).toBe('Hello')
		expect(context[2].content).toBe('First response')
		expect(context[3].content).toBe('How are you?')
		expect(context[4].content).toBe('Second response')
	})

	it('throws when agent not found', async () => {
		await expect(
			handler.execute('test', 'non-existent-agent', 'some-session'),
		).rejects.toThrow()
	})
})
