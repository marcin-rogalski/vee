/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */
import type AgentDeleteUseCase from '@application/usecases/AgentDelete.usecase'
import type { RequestHandler } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentDelete from './AgentDelete.adapter'

describe('AgentDelete', () => {
	let mockUseCase: AgentDeleteUseCase
	let endpoint: import('@utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		mockUseCase = {
			execute: vi.fn().mockResolvedValue(undefined),
		} as unknown as AgentDeleteUseCase
		endpoint = AgentDelete(mockUseCase)
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('DELETE')
		expect(endpoint.path).toBe('/agents/{id:string}')
	})

	it('returns 2 handlers from toHandlers()', () => {
		const handlers = endpoint.toHandlers()

		expect(Array.isArray(handlers)).toBe(true)
		expect(handlers.length).toBe(2)
		expect(typeof handlers[0]).toBe('function')
		expect(typeof handlers[1]).toBe('function')
	})

	it('validates id param is present', async () => {
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

	it('calls useCase.execute with parsed id', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const mockReq = {
			params: { id: 'agent-123' },
			body: {},
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

		expect(mockUseCase.execute).toHaveBeenCalledWith('agent-123')
	})

	it('returns 204 No Content for void handler', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const mockReq = {
			params: { id: 'agent-123' },
			body: {},
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
})
