import { homedir } from 'node:os'
import { join } from 'node:path'
import * as process from 'node:process'
import type LoggerPort from '@application/ports/Logger.port'
import { z } from 'zod'

class NodeEnvironment {
	static readonly schema = z.object({
		NODE_ENV: z
			.enum(['development', 'production', 'test'])
			.default('development'),

		// paths
		CONFIG_FOLDER: z.string().default(`${homedir()}/.vee`),
		AGENT_REPOSITORY_FILE: z.string().default('agents.json'),
		PROVIDER_REPOSITORY_FILE: z.string().default('integrations.json'),
		SESSION_REPOSITORY_FILE: z.string().default('sessions.json'),
		CONTEXT_REPOSITORY_FILE: z.string().default('context.json'),
		CHAT_MESSAGE_REPOSITORY_FILE: z.string().default('chat-messages.json'),

		// ports
		SEVER_PORT: z.coerce.number().default(3000),
	})

	public readonly mode: 'development' | 'production' | 'test'

	// paths
	public readonly configFolderPath: string
	public readonly agentRepositoryPath: string
	public readonly integrationRepositoryPath: string
	public readonly sessionRepositoryPath: string
	public readonly contextRepositoryPath: string
	public readonly chatMessageRepositoryPath: string

	//ports
	public readonly serverPort: number

	constructor(private readonly logger: LoggerPort) {
		const env = NodeEnvironment.schema.parse(process.env)

		this.mode = env.NODE_ENV

		// paths
		this.configFolderPath = env.CONFIG_FOLDER
		this.agentRepositoryPath = join(
			env.CONFIG_FOLDER,
			env.AGENT_REPOSITORY_FILE,
		)
		this.integrationRepositoryPath = join(
			env.CONFIG_FOLDER,
			env.PROVIDER_REPOSITORY_FILE,
		)
		this.sessionRepositoryPath = join(
			env.CONFIG_FOLDER,
			env.SESSION_REPOSITORY_FILE,
		)
		this.contextRepositoryPath = join(
			env.CONFIG_FOLDER,
			env.CONTEXT_REPOSITORY_FILE,
		)
		this.chatMessageRepositoryPath = join(
			env.CONFIG_FOLDER,
			env.CHAT_MESSAGE_REPOSITORY_FILE,
		)

		// ports
		this.serverPort = env.SEVER_PORT

		this.logger.info('Environment loaded', {
			mode: this.mode,
			configFolderPath: this.configFolderPath,
			agentRepositoryPath: this.agentRepositoryPath,
			integrationRepositoryPath: this.integrationRepositoryPath,
			sessionRepositoryPath: this.sessionRepositoryPath,
			contextRepositoryPath: this.contextRepositoryPath,
			chatMessageRepositoryPath: this.chatMessageRepositoryPath,
			serverPort: env.SEVER_PORT,
		})
	}
}
export default NodeEnvironment
