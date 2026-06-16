import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
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
import InferUseCase from '@application/usecases/Infer.usecase'
import ProviderDeleteUseCase from '@application/usecases/ProviderDelete.usecase'
import ProviderListUseCase from '@application/usecases/ProviderList.usecase'
import ProviderUpsertUseCase from '@application/usecases/ProviderUpsert.usecase'
import SessionCreateUseCase from '@application/usecases/SessionCreate.usecase'
import SessionDeleteUseCase from '@application/usecases/SessionDelete.usecase'
import SessionListUseCase from '@application/usecases/SessionList.usecase'
import OpenAIProvider from '@infrastructure/driven/providers/OpenAIProvider'
import DefaultProviderRegistry from '@infrastructure/driven/registries/DefaultProviderRegistry'
import ToolRegistry from '@infrastructure/driven/registries/ToolRegistry'
import InMemoryContextRepository from '@infrastructure/driven/repositories/InMemoryContextRepository'
import InMemorySessionRepository from '@infrastructure/driven/repositories/InMemorySessionRepository'
import JsonAgentRepository from '@infrastructure/driven/repositories/JsonAgentRepository'
import JsonProviderRepository from '@infrastructure/driven/repositories/JsonProviderRepository'
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
	infer: InstanceType<typeof InferUseCase>
}

const logger = new ConsoleLogger()
const env = new NodeEnvironment(logger)
const agentRepository = new JsonAgentRepository(env.agentRepositoryPath)
const providerRepository = new JsonProviderRepository(
	env.integrationRepositoryPath,
)
const sessionRepository = new InMemorySessionRepository()
const contextRepository = new InMemoryContextRepository()
const toolRegistry = new ToolRegistry()
const providerRegistry = new DefaultProviderRegistry()
providerRegistry.register(
	'openai',
	() => new OpenAIProvider('openai-default'),
	OpenAIProvider.CONFIG_SCHEMA,
)
const eventBus = new InMemoryEventBus()

const compositionRoot: CompositionRoot = {
	logger,
	env,
	agentRepository,
	providerRepository,
	sessionRepository,
	contextRepository,
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
	infer: new InferUseCase(
		sessionRepository,
		contextRepository,
		providerRepository,
		providerRegistry,
		agentRepository,
		toolRegistry,
		eventBus,
	),
}

export default compositionRoot
export type { CompositionRoot }
