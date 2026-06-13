/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */
import type AgentUpsertUseCase from '@application/usecases/AgentUpsert.usecase'
import type { RequestHandler } from 'express'
import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentUpsert from './AgentUpsert.adapter'

describe('AgentUpsert', () => {
	let mockUseCase: AgentUpsertUseCase
	let endpoint: import('@infrastructure/utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		mockUseCase = {
			execute: vi.fn().mockResolvedValue(undefined),
		} as unknown as AgentUpsertUseCase
		endpoint = AgentUpsert(mockUseCase)
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('POST')
		expect(endpoint.path).toBe('/agents')
	})

	it('returns 2 handlers from toHandlers()', () => {
		const handlers = endpoint.toHandlers()

		expect(Array.isArray(handlers)).toBe(true)
		expect(handlers.length).toBe(2)
		expect(typeof handlers[0]).toBe('function')
		expect(typeof handlers[1]).toBe('function')
	})

	it('validates required body fields', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const validationMiddleware = handlers[0]

		const mockReq = {
			params: {},
			body: {},
			query: {},
		} as any
		const mockRes = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any
		const next = vi.fn()

		validationMiddleware?.(mockReq, mockRes, next)

		expect(mockRes.status).toHaveBeenCalledWith(400)
		expect(mockRes.json).toHaveBeenCalled()
		expect(next).not.toHaveBeenCalled()
	})

	it('calls useCase.execute with parsed body object', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const agentBody = {
			id: 'agent-1',
			name: 'Test Agent',
			description: 'A test agent',
			systemPrompt: 'You are helpful',
			providerId: 'openai',
			providerConfiguration: { model: 'gpt-4' },
			toolIds: ['tool-1'],
		}

		const mockReq = {
			params: {},
			body: agentBody,
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
			sendStatus: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		await promise

		expect(mockUseCase.execute).toHaveBeenCalledWith(agentBody)
	})

	it('returns 204 No Content for void handler', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const agentBody = {
			id: 'agent-1',
			name: 'Test Agent',
		}

		const mockReq = {
			params: {},
			body: agentBody,
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
			sendStatus: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		await promise

		expect(mockRes.sendStatus).toHaveBeenCalledWith(204)
	})

	it('returns 500 and json error when useCase.execute rejects', async () => {
		;(mockUseCase.execute as Mock).mockRejectedValue(new Error('Upsert failed'))

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const agentBody = {
			id: 'agent-1',
			name: 'Test Agent',
		}

		const mockReq = {
			params: {},
			body: agentBody,
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
			sendStatus: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(500)
		expect(mockRes.json).toHaveBeenCalled()
	})
})
