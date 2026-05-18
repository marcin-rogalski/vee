/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */
import type ProviderUpsertUseCase from '@application/usecases/ProviderUpsert.usecase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderUpsert from './ProviderUpsert.adapter'

describe('ProviderUpsert', () => {
	let mockUseCase: ProviderUpsertUseCase
	let endpoint: import('@utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		mockUseCase = {
			execute: vi.fn().mockResolvedValue(undefined),
		} as unknown as ProviderUpsertUseCase
		endpoint = ProviderUpsert(mockUseCase)
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('POST')
		expect(endpoint.path).toBe('/providers')
	})

	it('returns 2 handlers from toHandlers()', () => {
		const handlers = endpoint.toHandlers()

		expect(Array.isArray(handlers)).toBe(true)
		expect(handlers.length).toBe(2)
		expect(typeof handlers[0]).toBe('function')
		expect(typeof handlers[1]).toBe('function')
	})

	it('validates required body fields', async () => {
		const handlers = endpoint.toHandlers()
		const validationMiddleware = handlers[0]!

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

		validationMiddleware(mockReq, mockRes, next)

		expect(mockRes.status).toHaveBeenCalledWith(400)
		expect(mockRes.json).toHaveBeenCalled()
		expect(next).not.toHaveBeenCalled()
	})

	it('calls useCase.execute with mapped provider object', async () => {
		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]!

		const providerBody = {
			id: 'prov-1',
			name: 'OpenAI',
			type: 'llm',
			configSchema: [
				{
					key: 'model',
					required: true,
					type: 'string',
					options: ['gpt-4', 'gpt-3.5'],
					description: 'Model name',
				},
				{
					key: 'temperature',
					required: false,
					type: 'number',
					description: 'Temperature setting',
				},
			],
		}

		const expectedProvider = {
			id: 'prov-1',
			name: 'OpenAI',
			type: 'llm',
			configSchema: [
				{
					key: 'model',
					required: true,
					type: 'string',
					options: ['gpt-4', 'gpt-3.5'],
					description: 'Model name',
				},
				{
					key: 'temperature',
					required: false,
					type: 'number',
					options: undefined,
					description: 'Temperature setting',
				},
			],
		}

		const mockReq = {
			params: {},
			body: providerBody,
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
			sendStatus: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware(mockReq, mockRes, next)
		await promise

		expect(mockUseCase.execute).toHaveBeenCalledWith(expectedProvider)
	})

	it('returns 204 No Content for void handler', async () => {
		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]!

		const providerBody = {
			id: 'prov-1',
			name: 'OpenAI',
			type: 'llm',
			configSchema: [],
		}

		const mockReq = {
			params: {},
			body: providerBody,
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
			sendStatus: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware(mockReq, mockRes, next)
		await promise

		expect(mockRes.sendStatus).toHaveBeenCalledWith(204)
	})
})
