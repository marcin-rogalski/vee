/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */
import type AgentListUseCase from '@application/usecases/AgentList.usecase'
import type { RequestHandler } from 'express'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import AgentList from './AgentList.adapter'

describe('AgentList', () => {
	let mockUseCase: AgentListUseCase
	let endpoint: import('@infrastructure/utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		mockUseCase = {
			execute: vi.fn().mockResolvedValue([{ id: 'a1', name: 'Agent' }]) as Mock<
				() => Promise<{ id: string; name: string }[]>
			>,
		} as unknown as AgentListUseCase
		endpoint = AgentList(mockUseCase)
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('GET')
		expect(endpoint.path).toBe('/agents')
	})

	it('returns 2 handlers from toHandlers()', () => {
		const handlers = endpoint.toHandlers()

		expect(Array.isArray(handlers)).toBe(true)
		expect(handlers.length).toBe(2)
		expect(typeof handlers[0]).toBe('function')
		expect(typeof handlers[1]).toBe('function')
	})

	it('calls useCase.execute and wraps result in { agents: [...] }', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const mockReq = {
			params: {},
			body: {},
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalledWith({
			agents: [{ id: 'a1', name: 'Agent' }],
		})
	})

	it('returns 200 with JSON body', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const mockReq = {
			params: {},
			body: {},
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalled()
	})

	it('returns 200 with empty agents array when no agents found', async () => {
		;(
			mockUseCase.execute as Mock<() => Promise<{ id: string; name: string }[]>>
		).mockResolvedValue([])

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const mockReq = {
			params: {},
			body: {},
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalledWith({ agents: [] })
	})

	it('returns 500 when useCase throws', async () => {
		;(
			mockUseCase.execute as Mock<() => Promise<{ id: string; name: string }[]>>
		).mockRejectedValue(new Error('List failed'))

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const mockReq = {
			params: {},
			body: {},
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
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
