import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type ChatMessageRepositoryPort from '@application/ports/ChatMessageRepository.port'
import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import type LoggerPort from '@application/ports/Logger.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import type ToolRegistryPort from '@application/ports/ToolRgistry.port'
import AgentDeleteUseCase from '@application/usecases/AgentDelete.usecase'
import AgentListUseCase from '@application/usecases/AgentList.usecase'
import AgentUpsertUseCase from '@application/usecases/AgentUpsert.usecase'
import BuildContextUseCase from '@application/usecases/BuildContext.usecase'
import InferOrchestratorUseCase from '@application/usecases/InferOrchestrator.usecase'
import ProviderDeleteUseCase from '@application/usecases/ProviderDelete.usecase'
import ProviderListUseCase from '@application/usecases/ProviderList.usecase'
import ProviderUpsertUseCase from '@application/usecases/ProviderUpsert.usecase'
import SessionCreateUseCase from '@application/usecases/SessionCreate.usecase'
import SessionDeleteUseCase from '@application/usecases/SessionDelete.usecase'
import SessionListUseCase from '@application/usecases/SessionList.usecase'
import OpenAIProvider from '@infrastructure/driven/providers/OpenAIProvider'
import DefaultProviderRegistry from '@infrastructure/driven/registries/DefaultProviderRegistry'
import ToolRegistry from '@infrastructure/driven/registries/ToolRegistry'
import JsonAgentRepository from '@infrastructure/driven/repositories/JsonAgentRepository'
import JsonChatMessageRepository from '@infrastructure/driven/repositories/JsonChatMessageRepository'
import JsonContextRepository from '@infrastructure/driven/repositories/JsonContextRepository'
import JsonProviderRepository from '@infrastructure/driven/repositories/JsonProviderRepository'
import JsonSessionRepository from '@infrastructure/driven/repositories/JsonSessionRepository'
import ChatMessageServiceAdapter from '@infrastructure/driven/services/ChatMessageService.adapter'
import ContextServiceAdapter from '@infrastructure/driven/services/ContextService.adapter'
import ConsoleLogger from '@infrastructure/utilities/ConsoleLogger.adapter'
import InMemoryEventBus from '@infrastructure/utilities/InMemoryEventBus'
import NodeEnvironment from '@infrastructure/utilities/NodeEnvironment.adapter'

interface CompositionRoot {
	logger: LoggerPort
	env: InstanceType<typeof NodeEnvironment>
	agentRepository: AgentRepositoryPort
	providerRepository: ProviderRepositoryPort
	sessionRepository: SessionRepositoryPort
	contextRepository: ContextRepositoryPort
	chatMessageRepository: ChatMessageRepositoryPort
	toolRegistry: ToolRegistryPort
	providerRegistry: ProviderRegistryPort
	eventBus: EventBusPort
	agentUpsert: InstanceType<typeof AgentUpsertUseCase>
	agentList: InstanceType<typeof AgentListUseCase>
	agentDelete: InstanceType<typeof AgentDeleteUseCase>
	providerUpsert: InstanceType<typeof ProviderUpsertUseCase>
	providerList: InstanceType<typeof ProviderListUseCase>
	providerDelete: InstanceType<typeof ProviderDeleteUseCase>
	sessionCreate: InstanceType<typeof SessionCreateUseCase>
	sessionList: InstanceType<typeof SessionListUseCase>
	sessionDelete: InstanceType<typeof SessionDeleteUseCase>
	infer: InstanceType<typeof InferOrchestratorUseCase>
}

const logger = new ConsoleLogger()
const env = new NodeEnvironment(logger)
const agentRepository = new JsonAgentRepository(env.agentRepositoryPath)
const providerRepository = new JsonProviderRepository(
	env.integrationRepositoryPath,
)
const sessionRepository = new JsonSessionRepository(env.sessionRepositoryPath)
const contextRepository = new JsonContextRepository(env.contextRepositoryPath)
const chatMessageRepository = new JsonChatMessageRepository(
	env.chatMessageRepositoryPath,
)
const toolRegistry = new ToolRegistry()
const providerRegistry = new DefaultProviderRegistry()
providerRegistry.register(
	'openai',
	() => new OpenAIProvider('openai-default'),
	OpenAIProvider.CONFIG_SCHEMA,
)
const eventBus = new InMemoryEventBus()

const contextService = new ContextServiceAdapter(contextRepository)
const chatMessageService = new ChatMessageServiceAdapter(chatMessageRepository)
const buildContextUseCase = new BuildContextUseCase(contextService)

const compositionRoot: CompositionRoot = {
	logger,
	env,
	agentRepository,
	providerRepository,
	sessionRepository,
	contextRepository,
	chatMessageRepository,
	toolRegistry,
	providerRegistry,
	eventBus,
	agentUpsert: new AgentUpsertUseCase(
		agentRepository,
		providerRepository,
		toolRegistry,
		eventBus,
	),
	agentList: new AgentListUseCase(agentRepository),
	agentDelete: new AgentDeleteUseCase(agentRepository, eventBus),
	providerUpsert: new ProviderUpsertUseCase(providerRepository, eventBus),
	providerList: new ProviderListUseCase(providerRepository),
	providerDelete: new ProviderDeleteUseCase(
		providerRepository,
		agentRepository,
		eventBus,
	),
	sessionCreate: new SessionCreateUseCase(sessionRepository, eventBus),
	sessionList: new SessionListUseCase(sessionRepository),
	sessionDelete: new SessionDeleteUseCase(sessionRepository, eventBus),
	infer: new InferOrchestratorUseCase(
		agentRepository,
		providerRepository,
		providerRegistry,
		toolRegistry,
		contextService,
		chatMessageService,
		eventBus,
		buildContextUseCase,
	),
}

export default compositionRoot
export type { CompositionRoot }
