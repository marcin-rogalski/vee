/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */
import type ProviderDeleteUseCase from '@application/usecases/ProviderDelete.usecase'
import type { RequestHandler } from 'express'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import ProviderDelete from './ProviderDelete.adapter'

describe('ProviderDelete', () => {
	let mockUseCase: ProviderDeleteUseCase
	let endpoint: import('@infrastructure/utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		mockUseCase = {
			execute: vi.fn().mockResolvedValue(undefined),
		} as unknown as ProviderDeleteUseCase
		endpoint = ProviderDelete(mockUseCase)
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('DELETE')
		expect(endpoint.path).toBe('/providers/{id:string}')
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
			params: { id: 'provider-1' },
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

		expect(mockUseCase.execute).toHaveBeenCalledWith('provider-1')
	})

	it('returns 204 No Content for void handler', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const mockReq = {
			params: { id: 'provider-1' },
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

	it('returns 500 when useCase throws', async () => {
		;(mockUseCase.execute as Mock).mockRejectedValue(new Error('Delete failed'))

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const mockReq = {
			params: { id: 'provider-1' },
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

		expect(mockRes.status).toHaveBeenCalledWith(500)
		expect(mockRes.json).toHaveBeenCalled()
	})
})
