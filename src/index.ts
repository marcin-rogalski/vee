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
import DefaultProviderRegistry from '@driven/registries/DefaultProviderRegistry'
import ToolRegistry from '@driven/registries/ToolRegistry'
import InMemoryAgentRepository from '@driven/repositories/InMemoryAgentRepository'
import InMemoryContextRepository from '@driven/repositories/InMemoryContextRepository'
import InMemoryProviderRepository from '@driven/repositories/InMemoryProviderRepository'
import InMemorySessionRepository from '@driven/repositories/InMemorySessionRepository'
import AgentDelete from '@driving/AgentDelete.adapter'
import AgentList from '@driving/AgentList.adapter'
import AgentUpsert from '@driving/AgentUpsert.adapter'
import Health from '@driving/Health.adapter'
import Infer from '@driving/Infer.adapter'
import ProviderDelete from '@driving/ProviderDelete.adapter'
import ProviderList from '@driving/ProviderList.adapter'
import ProviderUpsert from '@driving/ProviderUpsert.adapter'
import SessionCreate from '@driving/SessionCreate.adapter'
import SessionDelete from '@driving/SessionDelete.adapter'
import SessionList from '@driving/SessionList.adapter'
import ConsoleLogger from '@utilities/ConsoleLogger.adapter'
import ExpressServer from '@utilities/ExpressServer.adapter'
import InMemoryEventBus from '@utilities/InMemoryEventBus'
import NodeEnvironment from '@utilities/NodeEnvironment.adapter'

async function main() {
	// utilities
	const logger = new ConsoleLogger()
	const environment = new NodeEnvironment(logger)
	const server = new ExpressServer(environment.serverPort, logger)

	// driven adapters
	const agentRepository = new InMemoryAgentRepository()
	const providerRepository = new InMemoryProviderRepository()
	const sessionRepository = new InMemorySessionRepository()
	const contextRepository = new InMemoryContextRepository()
	const toolRegistry = new ToolRegistry()
	const providerRegistry = new DefaultProviderRegistry()
	const eventBus = new InMemoryEventBus()

	// use cases
	const agentUpsert = new AgentUpsertUseCase(agentRepository)
	const agentList = new AgentListUseCase(agentRepository)
	const agentDelete = new AgentDeleteUseCase(agentRepository)
	const providerUpsert = new ProviderUpsertUseCase(providerRepository)
	const providerList = new ProviderListUseCase(providerRepository)
	const providerDelete = new ProviderDeleteUseCase(providerRepository)
	const sessionCreate = new SessionCreateUseCase(sessionRepository)
	const sessionList = new SessionListUseCase(sessionRepository)
	const sessionDelete = new SessionDeleteUseCase(sessionRepository)
	const infer = new InferUseCase(
		sessionRepository,
		contextRepository,
		providerRepository,
		providerRegistry,
		agentRepository,
		toolRegistry,
		eventBus,
	)

	// driving endpoints
	const healthEndpoint = Health()
	const agentListEndpoint = AgentList(agentList)
	const agentUpsertEndpoint = AgentUpsert(agentUpsert)
	const agentDeleteEndpoint = AgentDelete(agentDelete)
	const providerListEndpoint = ProviderList(providerList)
	const providerUpsertEndpoint = ProviderUpsert(providerUpsert)
	const providerDeleteEndpoint = ProviderDelete(providerDelete)
	const sessionCreateEndpoint = SessionCreate(sessionCreate)
	const sessionListEndpoint = SessionList(sessionList)
	const sessionDeleteEndpoint = SessionDelete(sessionDelete)
	const inferEndpoint = Infer(infer)

	// init
	server.register(
		healthEndpoint,
		agentListEndpoint,
		agentUpsertEndpoint,
		agentDeleteEndpoint,
		providerListEndpoint,
		providerUpsertEndpoint,
		providerDeleteEndpoint,
		sessionCreateEndpoint,
		sessionListEndpoint,
		sessionDeleteEndpoint,
		inferEndpoint,
	)

	await server.start()

	// Graceful shutdown
	process.on('SIGINT', () => {
		sessionRepository.destroy()
		process.exit(0)
	})
	process.on('SIGTERM', () => {
		sessionRepository.destroy()
		process.exit(0)
	})
}

main().catch((error) => {
	console.error('Startup error:', error)
	process.exit(1)
})
