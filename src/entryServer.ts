import AgentDelete from '@infrastructure/driving/http/AgentDelete.adapter'
import AgentList from '@infrastructure/driving/http/AgentList.adapter'
import AgentUpsert from '@infrastructure/driving/http/AgentUpsert.adapter'
import EventsSSE from '@infrastructure/driving/http/EventsSSE.adapter'
import Health from '@infrastructure/driving/http/Health.adapter'
import Infer from '@infrastructure/driving/http/Infer.adapter'
import ProviderDelete from '@infrastructure/driving/http/ProviderDelete.adapter'
import ProviderList from '@infrastructure/driving/http/ProviderList.adapter'
import ProviderUpsert from '@infrastructure/driving/http/ProviderUpsert.adapter'
import SessionCreate from '@infrastructure/driving/http/SessionCreate.adapter'
import SessionDelete from '@infrastructure/driving/http/SessionDelete.adapter'
import SessionList from '@infrastructure/driving/http/SessionList.adapter'
import ExpressServer from '@infrastructure/utilities/ExpressServer.adapter'
import compositionRoot from './compositionRoot'

const server = new ExpressServer(
	compositionRoot.env.serverPort,
	compositionRoot.logger,
)

const healthEndpoint = Health()
const agentListEndpoint = AgentList(compositionRoot.agentList)
const agentUpsertEndpoint = AgentUpsert(compositionRoot.agentUpsert)
const agentDeleteEndpoint = AgentDelete(compositionRoot.agentDelete)
const providerListEndpoint = ProviderList(compositionRoot.providerList)
const providerUpsertEndpoint = ProviderUpsert(compositionRoot.providerUpsert)
const providerDeleteEndpoint = ProviderDelete(compositionRoot.providerDelete)
const sessionCreateEndpoint = SessionCreate(compositionRoot.sessionCreate)
const sessionListEndpoint = SessionList(compositionRoot.sessionList)
const sessionDeleteEndpoint = SessionDelete(compositionRoot.sessionDelete)
const inferEndpoint = Infer(compositionRoot.infer)
const eventsSSEEndpoint = EventsSSE(compositionRoot.eventBus)

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
	eventsSSEEndpoint,
)

;(async () => {
	await server.start()
})()

process.on('SIGINT', () => {
	// server.stop()
	process.exit(0)
})
process.on('SIGTERM', () => {
	// server.stop()
	process.exit(0)
})
