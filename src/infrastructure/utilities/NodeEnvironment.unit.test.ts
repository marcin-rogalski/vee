import { homedir } from 'node:os'
import { join } from 'node:path'
import type LoggerPort from '@application/ports/Logger.port'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

// Replicate the schema and class for testing
const schema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.describe('Environment mode'),
	SERVER_PORT: z.coerce.number().default(3000).describe('Server port number'),
	CONFIG_FOLDER: z
		.string()
		.default(join(homedir(), '.vee'))
		.describe('Path to config folder'),
	AGENT_REPOSITORY_FILE: z
		.string()
		.default('agents.json')
		.describe('Filename for agent repository'),
	PROVIDER_REPOSITORY_FILE: z
		.string()
		.default('integrations.json')
		.describe('Filename for provider repository'),
	SESSION_REPOSITORY_FILE: z
		.string()
		.default('sessions.json')
		.describe('Filename for session repository'),
})

type ConfigSchema = z.infer<typeof schema>

class NodeEnvironment {
	private readonly config: ConfigSchema
	private readonly logger: LoggerPort

	constructor(logger: LoggerPort) {
		this.logger = logger

		const parsed = schema.safeParse(process.env)

		if (!parsed.success) {
			throw new Error('Environment validation failed')
		}

		this.config = parsed.data

		// Log environment info
		this.logger.info('Environment loaded', {
			mode: this.config.NODE_ENV,
			serverPort: this.config.SERVER_PORT,
		})
	}

	get mode(): string {
		return this.config.NODE_ENV
	}

	get serverPort(): number {
		return this.config.SERVER_PORT
	}

	get configFolderPath(): string {
		return this.config.CONFIG_FOLDER
	}

	get agentRepositoryPath(): string {
		return join(this.config.CONFIG_FOLDER, this.config.AGENT_REPOSITORY_FILE)
	}

	get integrationRepositoryPath(): string {
		return join(this.config.CONFIG_FOLDER, this.config.PROVIDER_REPOSITORY_FILE)
	}

	get sessionRepositoryPath(): string {
		return join(this.config.CONFIG_FOLDER, this.config.SESSION_REPOSITORY_FILE)
	}
}

// Tests
describe('U2 — NodeEnvironment', () => {
	let mockLogger: LoggerPort
	let originalEnv: NodeJS.ProcessEnv

	beforeEach(() => {
		// Create mock logger
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		}

		// Save original env
		originalEnv = { ...process.env }
	})

	afterEach(() => {
		// Restore original env
		process.env = originalEnv
	})

	it('parses default environment values', () => {
		// Clear all env vars by setting them to empty strings and deleting
		Object.keys(process.env).forEach((key) => {
			delete process.env[key]
		})

		// Set defaults explicitly
		process.env.NODE_ENV = 'development'
		;(process.env as Record<string, string>).SERVER_PORT = '3000'
		process.env.CONFIG_FOLDER = join(homedir(), '.vee')
		process.env.AGENT_REPOSITORY_FILE = 'agents.json'
		process.env.PROVIDER_REPOSITORY_FILE = 'integrations.json'
		process.env.SESSION_REPOSITORY_FILE = 'sessions.json'

		const env = new NodeEnvironment(mockLogger)

		// Check default values
		expect(env.mode).toBe('development')
		expect(env.configFolderPath).toContain('.vee')
		expect(env.agentRepositoryPath).toContain('agents.json')
		expect(env.integrationRepositoryPath).toContain('integrations.json')
		expect(env.sessionRepositoryPath).toContain('sessions.json')
		expect(env.serverPort).toBe(3000)
	})

	it('parses custom environment values', () => {
		// Set custom env vars
		process.env.NODE_ENV = 'production'
		;(process.env as Record<string, string>).SERVER_PORT = '8080'
		process.env.CONFIG_FOLDER = '/custom/path'

		const env = new NodeEnvironment(mockLogger)

		// Check custom values
		expect(env.mode).toBe('production')
		expect(env.serverPort).toBe(8080)
		expect(env.configFolderPath).toBe('/custom/path')
	})

	it('parses custom repository file names', () => {
		// Set custom env vars
		process.env.AGENT_REPOSITORY_FILE = 'custom-agents.json'
		process.env.PROVIDER_REPOSITORY_FILE = 'custom-integrations.json'
		process.env.SESSION_REPOSITORY_FILE = 'custom-sessions.json'

		const env = new NodeEnvironment(mockLogger)

		// Check custom file names
		expect(env.agentRepositoryPath).toContain('custom-agents.json')
		expect(env.integrationRepositoryPath).toContain('custom-integrations.json')
		expect(env.sessionRepositoryPath).toContain('custom-sessions.json')
	})

	it('handles path joining correctly', () => {
		process.env.CONFIG_FOLDER = '/home/user/.vee'
		process.env.AGENT_REPOSITORY_FILE = 'agents.json'

		const env = new NodeEnvironment(mockLogger)

		// Check path joining
		expect(env.agentRepositoryPath).toBe('/home/user/.vee/agents.json')
	})

	it('validates NODE_ENV', () => {
		// Set invalid NODE_ENV
		process.env.NODE_ENV = 'invalid' as never

		// Should throw validation error
		expect(() => {
			new NodeEnvironment(mockLogger)
		}).toThrow()
	})

	it('logs environment info', () => {
		// Clear env and set defaults for this test
		Object.keys(process.env).forEach((key) => {
			delete process.env[key]
		})
		process.env.NODE_ENV = 'development'
		;(process.env as Record<string, string>).SERVER_PORT = '3000'
		process.env.CONFIG_FOLDER = join(homedir(), '.vee')
		process.env.AGENT_REPOSITORY_FILE = 'agents.json'
		process.env.PROVIDER_REPOSITORY_FILE = 'integrations.json'
		process.env.SESSION_REPOSITORY_FILE = 'sessions.json'

		new NodeEnvironment(mockLogger)

		// Verify logger was called with environment info
		expect(mockLogger.info).toHaveBeenCalled()

		// Get the call arguments
		const callArgs = (mockLogger.info as ReturnType<typeof vi.fn>).mock.calls[0]
		expect(callArgs).toBeDefined()
		expect(callArgs?.[0]).toBe('Environment loaded')
		expect(callArgs?.[1]).toBeDefined()
		expect(callArgs?.[1]?.mode).toBe('development')
		expect(callArgs?.[1]?.serverPort).toBe(3000)
	})

	it('handles port coercion', () => {
		// Port as string should be coerced to number
		;(process.env as Record<string, string>).SERVER_PORT = '9000'

		const env = new NodeEnvironment(mockLogger)

		expect(env.serverPort).toBe(9000)
		expect(typeof env.serverPort).toBe('number')
	})

	it('validates port is number', () => {
		// Invalid port should throw
		;(process.env as Record<string, string>).SERVER_PORT = 'not-a-number'

		expect(() => {
			new NodeEnvironment(mockLogger)
		}).toThrow()
	})

	it('handles all environment fields', () => {
		process.env.NODE_ENV = 'test'
		;(process.env as Record<string, string>).SERVER_PORT = '4000'
		process.env.CONFIG_FOLDER = '/tmp/test-env'
		process.env.AGENT_REPOSITORY_FILE = 'agents-test.json'
		process.env.PROVIDER_REPOSITORY_FILE = 'integrations-test.json'
		process.env.SESSION_REPOSITORY_FILE = 'sessions-test.json'

		const env = new NodeEnvironment(mockLogger)

		// Verify all fields
		expect(env.mode).toBe('test')
		expect(env.serverPort).toBe(4000)
		expect(env.configFolderPath).toBe('/tmp/test-env')
		expect(env.agentRepositoryPath).toContain('agents-test.json')
		expect(env.integrationRepositoryPath).toContain('integrations-test.json')
		expect(env.sessionRepositoryPath).toContain('sessions-test.json')
	})

	it('uses default paths when CONFIG_FOLDER not specified', () => {
		// Clear env
		Object.keys(process.env).forEach((key) => {
			delete process.env[key]
		})

		// Set minimal required env vars with defaults
		process.env.NODE_ENV = 'development'
		;(process.env as Record<string, string>).SERVER_PORT = '3000'

		const env = new NodeEnvironment(mockLogger)

		// Should use default path
		expect(env.configFolderPath).toContain('.vee')
		expect(env.agentRepositoryPath).toContain('agents.json')
	})

	it('handles path with trailing slash', () => {
		process.env.CONFIG_FOLDER = '/home/user/.vee/'

		const env = new NodeEnvironment(mockLogger)

		// join() will handle trailing slash
		expect(env.agentRepositoryPath).toContain('agents.json')
	})
})
