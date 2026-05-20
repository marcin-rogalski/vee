/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */
import type ProviderListUseCase from '@application/usecases/ProviderList.usecase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProviderList from './ProviderList.adapter'

describe('ProviderList', () => {
	let mockUseCase: ProviderListUseCase
	let endpoint: import('@utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		mockUseCase = {
			execute: vi.fn().mockResolvedValue([{ id: 'p1', name: 'OpenAI' }]),
		} as unknown as ProviderListUseCase
		endpoint = ProviderList(mockUseCase)
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('GET')
		expect(endpoint.path).toBe('/providers')
	})

	it('returns 2 handlers from toHandlers()', () => {
		const handlers = endpoint.toHandlers()

		expect(Array.isArray(handlers)).toBe(true)
		expect(handlers.length).toBe(2)
		expect(typeof handlers[0]).toBe('function')
		expect(typeof handlers[1]).toBe('function')
	})

	it('calls useCase.execute and wraps result in { providers: [...] }', async () => {
		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]!

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
		const promise = dispatchMiddleware(mockReq, mockRes, next)
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalledWith({
			providers: [{ id: 'p1', name: 'OpenAI' }],
		})
	})

	it('returns 200 with JSON body', async () => {
		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]!

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
		const promise = dispatchMiddleware(mockReq, mockRes, next)
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalled()
	})

	it('returns 200 with empty providers array when no providers found', async () => {
		mockUseCase.execute.mockResolvedValue([])

		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]!

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
		const promise = dispatchMiddleware(mockReq, mockRes, next)
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalledWith({ providers: [] })
	})

	it('returns 500 when useCase throws', async () => {
		mockUseCase.execute.mockRejectedValue(new Error('List failed'))

		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]!

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
		const promise = dispatchMiddleware(mockReq, mockRes, next)
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(500)
		expect(mockRes.json).toHaveBeenCalled()
	})
})
