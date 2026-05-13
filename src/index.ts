import Health from '@driving/Health.adapter'

import ConsoleLogger from '@utilities/ConsoleLogger.adapter'
import ExpressServer from '@utilities/ExpressServer.adapter'
import NodeEnvironment from '@utilities/NodeEnvironment.adapter'

async function main() {
	// utilities
	const logger = new ConsoleLogger()
	const environment = new NodeEnvironment(logger)
	const server = new ExpressServer(environment.serverPort, logger)

	// driven

	// driving
	const healthEndpoint = new Health()

	// init
	server.register(healthEndpoint)

	await server.start()

	// Graceful shutdown
	process.on('SIGINT', () => process.exit(0))
	process.on('SIGTERM', () => process.exit(0))
}

main().catch((error) => {
	console.error('Startup error:', error)
	process.exit(1)
})
