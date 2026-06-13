import { Command } from 'commander'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompositionRoot } from '../../compositionRoot'
import CLI from './CLI'

vi.mock('commander', async (importOriginal) => {
	const actual = (await importOriginal()) as Record<string, unknown>
	const RealCommand = actual.Command as typeof Command
	return {
		...actual,
		Command: class MockCommand extends RealCommand {
			private _name = ''
			private aliases: string[] = []
			private _usageValue = ''
			private _options: Array<{ flag: string; desc: string | undefined }> = []
			_addCommand: unknown[] = []
			_action?: (...args: unknown[]) => Promise<void> | void
			addHelpCommand = vi.fn()
			_usage = vi.fn()
			_option = vi.fn()
			helpInformation = vi.fn(() => 'help info')

			name(): string
			name(cmdName: string): Command
			name(cmdName?: string): Command | string {
				if (typeof cmdName === 'string') {
					this._name = cmdName
					return this as unknown as Command
				}
				return this._name
			}

			option(flag: string, desc?: string): Command {
				this._options.push({ flag, desc: desc ?? undefined })
				return this as unknown as Command
			}

			action(fn: (...args: unknown[]) => void): Command {
				this._action = fn
				return this as unknown as Command
			}

			addCommand(cmd: unknown): Command {
				this._addCommand.push(cmd)
				return this as unknown as Command
			}

			async parseAsync(_argv?: string[]): Promise<void> {
				return undefined
			}
		},
	}
})

vi.mock('../utilities/NodeEnvironment.adapter', () => ({
	default: { getEnv: vi.fn(() => 'development') },
}))

vi.mock('../utilities/ConsoleLogger.adapter', () => ({
	default: vi.fn(() => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	})),
}))

vi.mock('./driving/client.js', () => ({
	createClient: vi.fn(() => ({ agents: {}, sessions: {}, infer: vi.fn() })),
}))

vi.mock('./driving/cli/App', () => ({
	App: vi.fn(() => null),
}))

vi.mock('ink', () => ({
	render: vi.fn(() => ({ exit: vi.fn() })),
}))

vi.mock('ink-text-input', () => ({
	textInput: vi.fn(),
}))

describe('CLI', () => {
	let mockCore: CompositionRoot

	beforeEach(() => {
		vi.clearAllMocks()
		mockCore = {
			logger: {
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
				debug: vi.fn(),
			},
			environment: {
				mode: 'development' as const,
				configFolderPath: '',
				agentRepositoryPath: '',
				integrationRepositoryPath: '',
				sessionRepositoryPath: '',
				serverPort: 3000,
			},
			agentRepository: {
				upsert: vi.fn(),
				list: vi.fn(),
				delete: vi.fn(),
			},
			providerRepository: {
				upsert: vi.fn(),
				list: vi.fn(),
				delete: vi.fn(),
			},
			sessionRepository: {
				create: vi.fn(),
				list: vi.fn(),
				delete: vi.fn(),
				destroy: vi.fn(),
			},
			contextRepository: {
				upsert: vi.fn(),
				list: vi.fn(),
				delete: vi.fn(),
			},
			toolRegistry: {
				register: vi.fn(),
				list: vi.fn(),
			},
			providerRegistry: {
				register: vi.fn(),
				list: vi.fn(),
			},
			eventBus: {
				subscribe: vi.fn(),
				publish: vi.fn(),
			},
			agentUpsert: { execute: vi.fn() },
			agentList: { execute: vi.fn() },
			agentDelete: { execute: vi.fn() },
			providerUpsert: { execute: vi.fn() },
			providerList: { execute: vi.fn() },
			providerDelete: { execute: vi.fn() },
			sessionCreate: { execute: vi.fn() },
			sessionList: { execute: vi.fn() },
			sessionDelete: { execute: vi.fn() },
			infer: { execute: vi.fn() },
		} as unknown as CompositionRoot
	})

	describe('register', () => {
		it('should store a registered command', () => {
			const cli = new CLI(mockCore)
			const command = new Command('test')
			cli.register(command)
			expect(
				(cli as unknown as { registeredCommands: Command[] })
					.registeredCommands,
			).toHaveLength(1)
			expect(
				(cli as unknown as { registeredCommands: Command[] })
					.registeredCommands[0],
			).toBe(command)
		})

		it('should store multiple commands', () => {
			const cli = new CLI(mockCore)
			const cmd1 = new Command('list')
			const cmd2 = new Command('create')
			cli.register(cmd1)
			cli.register(cmd2)
			expect(
				(cli as unknown as { registeredCommands: Command[] })
					.registeredCommands,
			).toHaveLength(2)
		})

		it('should include a help command by default', () => {
			new CLI(mockCore)
			const CommandClass = Command as new (name?: string) => Command
			const instance = new CommandClass('test')
			expect((instance as Record<string, unknown>).addHelpCommand).toBeDefined()
		})
	})

	describe('run', () => {
		it('should call runInteractive when no args provided', async () => {
			const cli = new CLI(mockCore)
			const runInteractiveSpy = vi.spyOn(
				cli as unknown as { runInteractive: () => Promise<void> },
				'runInteractive' as 'runInteractive',
			)
			await cli.run([])
			expect(runInteractiveSpy).toHaveBeenCalled()
		})

		it('should parse arguments when args are provided', async () => {
			const cli = new CLI(mockCore)
			const program = cli as unknown as { program: Command }
			const parseAsyncSpy = vi.spyOn(program.program, 'parseAsync')
			parseAsyncSpy.mockResolvedValue(undefined)
			await cli.run(['node', 'vee', 'list'])
			expect(parseAsyncSpy).toHaveBeenCalled()
		})

		it('should log error and exit on parse failure', async () => {
			const cli = new CLI(mockCore)
			const program = cli as unknown as { program: Command }
			vi.spyOn(program.program, 'parseAsync').mockRejectedValue(
				new Error('Parse error'),
			)
			const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
				throw new Error('exit')
			})
			await expect(cli.run(['node', 'vee'])).rejects.toThrow('exit')
			expect(mockCore.logger.error).toHaveBeenCalled()
			exitSpy.mockRestore()
		})
	})
})
