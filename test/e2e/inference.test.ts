import * as http from 'node:http'
import { execa } from 'execa'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Router } from 'express'
import {
	CLI_ENTRY,
	cleanOutput,
	createTempDataDir,
	withDataDir,
} from './setup'
import { MockOpenAIServer } from './mock-openai-server'

/**
 * E2E: Full inference pipeline with a mock OpenAI-compatible server.
 *
 * Tests the complete flow:
 * Mock Server → OpenAIProvider → InferHandler → JSON Repositories → HTTP/CLI
 */
describe('E2E — Inference with mock OpenAI server', () => {
	const mockServer = new MockOpenAIServer([
		'Hello from mock LM Studio!',
		'Hello from mock LM Studio!',
	])
	let temp: ReturnType<typeof createTempDataDir>
	let env: Record<string, string>
	let server: any
	let expressApp: Router | undefined
	let httpServer: http.Server | undefined

	beforeAll(async () => {
		// Start mock OpenAI server
		await mockServer.start()

		// Set up isolated data directory
		temp = createTempDataDir()
		env = withDataDir(process.env, temp.dir)
	})

	afterAll(async () => {
		await mockServer.stop()
		temp.cleanup()
	})

	describe('Task 3.3: HTTP inference flow', () => {
		beforeAll(async () => {
			// Import composition root after env is set
			const { default: compositionRoot } = await import('../../src/compositionRoot')

			// Set up Express server with all needed endpoints
			const ExpressServer = (await import('@infrastructure/utilities/ExpressServer.adapter')).default
			const Health = (await import('@infrastructure/driving/http/Health.adapter')).default
			const ProviderUpsert = (await import('@infrastructure/driving/http/ProviderUpsert.adapter')).default
			const AgentUpsert = (await import('@infrastructure/driving/http/AgentUpsert.adapter')).default
			const SessionCreate = (await import('@infrastructure/driving/http/SessionCreate.adapter')).default
			const Infer = (await import('@infrastructure/driving/http/Infer.adapter')).default

			server = new ExpressServer(
				compositionRoot.env.serverPort + 100,
				compositionRoot.logger,
			)

			server.register(
				Health(),
				ProviderUpsert(compositionRoot.providerUpsert),
				AgentUpsert(compositionRoot.agentUpsert),
				SessionCreate(compositionRoot.sessionCreate),
				Infer(compositionRoot.infer),
			)

			// @ts-expect-error express is private
			expressApp = server.express
			httpServer = server.start()
		})

		it('completes a full inference flow through HTTP', async () => {
			// 1. Create provider pointing at mock server
			const providerRes = await request(expressApp!)
				.post('/providers')
				.send({
					id: 'mock-openai-e2e',
					name: 'Mock OpenAI',
					type: 'openai',
					configSchema: {
						$schema: 'https://json-schema.org/draft/2020-12/schema',
						type: 'object',
						properties: {
							model: { type: 'string' },
							apiKey: { type: 'string' },
							baseUrl: { type: 'string' },
						},
					},
					config: {
						model: 'test-model',
						apiKey: 'not-needed',
						baseUrl: `http://localhost:${mockServer.port}`,
					},
				})
			expect(providerRes.status).toBe(204)

			// 2. Create agent with that provider
			const agentRes = await request(expressApp!)
				.post('/agents')
				.send({
					id: 'test-agent-e2e',
					name: 'E2E Test Agent',
					providerId: 'mock-openai-e2e',
					systemPrompt: 'You are helpful.',
				})
			expect(agentRes.status).toBe(204)

			// 3. Create session
			const sessionRes = await request(expressApp!)
				.post('/sessions')
				.send({
					name: 'Inference Test',
					agentId: 'test-agent-e2e',
				})
			expect(sessionRes.status).toBe(200)
			const sessionId = sessionRes.body.id

			// 4. Execute inference
			const inferRes = await request(expressApp!)
				.post('/infer')
				.send({
					prompt: 'Say hello',
					agentId: 'test-agent-e2e',
					sessionId,
				})
			expect(inferRes.status).toBe(204)

			// 5. Verify inference completed (204 = success, no content)
			expect(inferRes.status).toBeDefined()
		})
	})

	describe('Task 3.4: CLI inference command', () => {
		it('streams inference output from CLI', async () => {
			// 1. Create provider via CLI
			await execa(
				'npx',
				[
					'tsx',
					CLI_ENTRY,
					'providers',
					'upsert',
					'--name',
					'Mock CLI',
					'--type',
					'openai',
					'--config',
					`model=test-model`,
					'--config',
					`apiKey=not-needed`,
					'--config',
					`baseUrl=http://localhost:${mockServer.port}`,
				],
				{ env },
			)

			// 2. Get provider ID
			const providerListOutput = await execa(
				'npx',
				['tsx', CLI_ENTRY, 'providers', 'list'],
				{ env },
			)
			const providerIdMatch = cleanOutput(providerListOutput.stdout).match(
				/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/,
			)
			expect(providerIdMatch).not.toBeNull()
			const providerId = providerIdMatch![0]

			// 3. Create agent via CLI
			await execa(
				'npx',
				[
					'tsx',
					CLI_ENTRY,
					'agents',
					'upsert',
					'--name',
					'CLI Test Agent',
					'--provider-id',
					providerId,
					'--prompt',
					'You are helpful.',
				],
				{ env },
			)

			// 4. Get agent ID
			const agentListOutput = await execa(
				'npx',
				['tsx', CLI_ENTRY, 'agents', 'list'],
				{ env },
			)
			const agentIdMatch = cleanOutput(agentListOutput.stdout).match(
				/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/,
			)
			expect(agentIdMatch).not.toBeNull()
			const agentId = agentIdMatch![0]

			// 5. Create session via CLI
			const sessionOutput = await execa(
				'npx',
				['tsx', CLI_ENTRY, 'sessions', 'create', 'CLI Inference Test', '--agent', agentId],
				{ env },
			)
			const sessionIdMatch = cleanOutput(sessionOutput.stdout).match(
				/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/,
			)
			expect(sessionIdMatch).not.toBeNull()
			const sessionId = sessionIdMatch![0]

			// 6. Run infer command and capture streamed output
			const inferProcess = execa(
				'npx',
				['tsx', CLI_ENTRY, 'infer', 'Say hello', '--agent-id', agentId, '--session-id', sessionId],
				{ env, timeout: 15000 },
			)

			// Wait for completion
			const { stdout } = await inferProcess
			const output = cleanOutput(stdout)

			// Verify inference completed
			expect(output).toContain('Inference complete')
			// Verify streamed tokens appear in output
			expect(output).toMatch(/Hello|mock|LM Studio/i)
		})
	})
})
