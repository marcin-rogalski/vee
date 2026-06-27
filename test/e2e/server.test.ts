import * as http from 'node:http'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Router } from 'express'
import AgentList from '@infrastructure/driving/http/AgentList.adapter'
import AgentUpsert from '@infrastructure/driving/http/AgentUpsert.adapter'
import ProviderList from '@infrastructure/driving/http/ProviderList.adapter'
import ProviderUpsert from '@infrastructure/driving/http/ProviderUpsert.adapter'
import SessionCreate from '@infrastructure/driving/http/SessionCreate.adapter'
import SessionList from '@infrastructure/driving/http/SessionList.adapter'
import ExpressServer from '@infrastructure/utilities/ExpressServer.adapter'
import { createTempDataDir } from './setup'

// We need to set up the data dir before importing compositionRoot,
// because compositionRoot reads env vars at module load time.
// Strategy: set env, then import the server entry dynamically.

describe('HTTP Server', () => {
	let temp: ReturnType<typeof createTempDataDir>
	let server: InstanceType<typeof ExpressServer>
	let app: Router | undefined
	let httpServer: http.Server | undefined

	beforeAll(() => {
		temp = createTempDataDir()
		process.env.CONFIG_FOLDER = temp.dir
		process.env.NODE_ENV = 'test'
	})

	afterAll(() => {
		temp.cleanup()
	})

	it('health endpoint returns ok', async () => {
		// Import compositionRoot after setting env
		const { default: compositionRoot } = await import('../../src/compositionRoot')

		server = new ExpressServer(
			compositionRoot.env.serverPort + 1,
			compositionRoot.logger,
		)

		const Health = (await import('@infrastructure/driving/http/Health.adapter'))
			.default
		server.register(Health())

		// @ts-expect-error express is private
		const expressApp = server.express

		const response = await request(expressApp).get('/health')
		expect(response.status).toBe(200)
		expect(response.body).toEqual({ status: 'ok' })
	})

	it('lists agents', async () => {
		const { default: compositionRoot } = await import('../../src/compositionRoot')

		server = new ExpressServer(
			compositionRoot.env.serverPort + 2,
			compositionRoot.logger,
		)

		const Health = (await import('@infrastructure/driving/http/Health.adapter'))
			.default
		const providerUpsertEndpoint = ProviderUpsert(compositionRoot.providerUpsert)
		const agentListEndpoint = AgentList(compositionRoot.agentList)
		const agentUpsertEndpoint = AgentUpsert(compositionRoot.agentUpsert)
		server.register(
			Health(),
			providerUpsertEndpoint,
			agentListEndpoint,
			agentUpsertEndpoint,
		)

		// @ts-expect-error express is private
		const expressApp = server.express

		// Create provider first
		const providerId = 'openai-provider-e2e-1'
		await request(expressApp)
			.post('/providers')
			.send({
				id: providerId,
				name: 'OpenAI',
				type: 'openai',
				configSchema: {
					$schema: 'https://json-schema.org/draft/2020-12/schema',
					type: 'object',
					properties: {
						model: { type: 'string' },
						apiKey: { type: 'string' },
					},
				},
				config: {
					model: 'gpt-4o',
					apiKey: 'test-key-123',
				},
			})

		// Create agent
		const agentId = 'agent-e2e-1'
		const createResponse = await request(expressApp)
			.post('/agents')
			.send({
				id: agentId,
				name: 'HTTP Test Agent',
				providerId,
				systemPrompt: 'You are a test agent',
				toolIds: [],
				providerOverrides: {},
			})
		expect(createResponse.status).toBe(204)

		// List agents
		const listResponse = await request(expressApp).get('/agents')
		expect(listResponse.status).toBe(200)
		expect(listResponse.body).toHaveProperty('agents')
		expect(listResponse.body.agents.length).toBeGreaterThan(0)
	})

	it('lists providers', async () => {
		const { default: compositionRoot } = await import('../../src/compositionRoot')

		server = new ExpressServer(
			compositionRoot.env.serverPort + 3,
			compositionRoot.logger,
		)

		const providerListEndpoint = ProviderList(compositionRoot.providerList)
		server.register(providerListEndpoint)

		// @ts-expect-error express is private
		const expressApp = server.express

		const response = await request(expressApp).get('/providers')
		expect(response.status).toBe(200)
		expect(response.body).toHaveProperty('providers')
	})

	it('creates and lists sessions', async () => {
		const { default: compositionRoot } = await import('../../src/compositionRoot')

		server = new ExpressServer(
			compositionRoot.env.serverPort + 4,
			compositionRoot.logger,
		)

		const providerUpsertEndpoint = ProviderUpsert(compositionRoot.providerUpsert)
		const agentUpsertEndpoint = AgentUpsert(compositionRoot.agentUpsert)
		const sessionCreateEndpoint = SessionCreate(compositionRoot.sessionCreate)
		const sessionListEndpoint = SessionList(compositionRoot.sessionList)
		server.register(
			providerUpsertEndpoint,
			agentUpsertEndpoint,
			sessionCreateEndpoint,
			sessionListEndpoint,
		)

		// @ts-expect-error express is private
		const expressApp = server.express

		// Create provider first
		const providerId = 'openai-provider-e2e-2'
		await request(expressApp)
			.post('/providers')
			.send({
				id: providerId,
				name: 'OpenAI',
				type: 'openai',
				configSchema: {
					$schema: 'https://json-schema.org/draft/2020-12/schema',
					type: 'object',
					properties: {
						model: { type: 'string' },
						apiKey: { type: 'string' },
					},
				},
				config: {
					model: 'gpt-4o',
					apiKey: 'test-key-123',
				},
			})

		// Create agent
		const agentId = 'agent-e2e-2'
		await request(expressApp)
			.post('/agents')
			.send({
				id: agentId,
				name: 'Session Test Agent',
				providerId,
				systemPrompt: 'Test',
				toolIds: [],
				providerOverrides: {},
			})

		// Create session
		const sessionResponse = await request(expressApp)
			.post('/sessions')
			.send({
				name: 'HTTP Test Session',
				agentId,
			})
		expect(sessionResponse.status).toBe(200)

		// List sessions
		const listResponse = await request(expressApp).get('/sessions')
		expect(listResponse.status).toBe(200)
		expect(listResponse.body.sessions.length).toBeGreaterThan(0)
	})
})
