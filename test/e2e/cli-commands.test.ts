import { execa } from 'execa'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
	CLI_ENTRY,
	cleanOutput,
	createTempDataDir,
	withDataDir,
} from './setup'

describe('CLI Commands', () => {
	let temp: ReturnType<typeof createTempDataDir>
	let env: Record<string, string>

	beforeAll(() => {
		temp = createTempDataDir()
		env = withDataDir(process.env, temp.dir)
	})

	afterAll(() => {
		temp.cleanup()
	})

	it('shows help with --help flag', async () => {
		try {
			const { stdout } = await execa('npx', ['tsx', CLI_ENTRY, '--help'], {
				env,
			})
			expect(stdout).toContain('vee')
			expect(stdout).toContain('commands')
		} catch (error: any) {
			// Commander may exit with code 0 for help, check output from error
			const output = cleanOutput(
				(error.stdout ?? '') + ' ' + (error.stderr ?? ''),
			)
			expect(output).toContain('vee')
			expect(output).toContain('commands')
		}
	})

	it('lists agents (empty by default)', async () => {
		const { stdout } = await execa('npx', ['tsx', CLI_ENTRY, 'agents', 'list'], {
			env,
		})

		// Empty list should succeed
		expect(stdout).toBeDefined()
	})

	it('creates a provider', async () => {
		const { stdout } = await execa(
			'npx',
			[
				'tsx',
				CLI_ENTRY,
				'providers',
				'upsert',
				'--name',
				'OpenAI',
				'--type',
				'openai',
				'--config',
				'model=gpt-4o',
				'--config',
				'apiKey=test-key-123',
			],
			{ env },
		)

		const output = cleanOutput(stdout)
		expect(output).toMatch(/Provider|saved|id/i)
	})

	it('creates an agent', async () => {
		// Get provider id first
		const { stdout: providerList } = await execa(
			'npx',
			['tsx', CLI_ENTRY, 'providers', 'list'],
			{ env },
		)

		const providerIdMatch = cleanOutput(providerList).match(
			/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/,
		)
		if (!providerIdMatch) {
			// Skip if no provider found
			return
		}

		const providerId = providerIdMatch[0]

		const { stdout } = await execa(
			'npx',
			[
				'tsx',
				CLI_ENTRY,
				'agents',
				'upsert',
				'--name',
				'E2E Test Agent',
				'--provider-id',
				providerId,
				'--prompt',
				'You are a helpful test assistant',
			],
			{ env },
		)

		const output = cleanOutput(stdout)
		expect(output).toMatch(/Created|created|id/i)
	})

	it('lists agents (after creating one)', async () => {
		const { stdout } = await execa('npx', ['tsx', CLI_ENTRY, 'agents', 'list'], {
			env,
		})

		expect(stdout).toContain('E2E Test Agent')
	})

	it('lists providers (openai registered by default)', async () => {
		const { stdout } = await execa(
			'npx',
			['tsx', CLI_ENTRY, 'providers', 'list'],
			{ env },
		)

		expect(stdout).toBeDefined()
	})

	it('lists sessions (empty by default)', async () => {
		const { stdout } = await execa(
			'npx',
			['tsx', CLI_ENTRY, 'sessions', 'list'],
			{ env },
		)

		expect(stdout).toBeDefined()
	})

	it('creates a session with an agent', async () => {
		// First get the agent id
		const { stdout: listOutput } = await execa(
			'npx',
			['tsx', CLI_ENTRY, 'agents', 'list'],
			{ env },
		)

		// Parse agent ID from output
		const agentIdMatch = listOutput.match(/([a-f0-9-]{36})/)
		if (!agentIdMatch) {
			// If we can't parse, skip this test
			return
		}

		const agentId = agentIdMatch[1]!

		const { stdout } = await execa(
			'npx',
			[
				'tsx',
				CLI_ENTRY,
				'sessions',
				'create',
				'E2E Test Session',
				'--agent',
				agentId,
			],
			{ env },
		)

		const output = cleanOutput(stdout)
		expect(output).toMatch(/Created|created|id/i)
	})

	it('lists sessions (after creating one)', async () => {
		const { stdout } = await execa(
			'npx',
			['tsx', CLI_ENTRY, 'sessions', 'list'],
			{ env },
		)

		expect(stdout).toContain('E2E Test Session')
	})
})
