/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */
import type SessionCreateUseCase from '@application/usecases/SessionCreate.usecase'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import SessionCreate from './SessionCreate.adapter'

describe('SessionCreate', () => {
	let mockUseCase: SessionCreateUseCase
	let endpoint: import('@infrastructure/utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		mockUseCase = {
			execute: vi.fn().mockResolvedValue('session-1'),
		} as unknown as SessionCreateUseCase
		endpoint = SessionCreate(mockUseCase)
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('POST')
		expect(endpoint.path).toBe('/sessions')
	})

	it('returns 2 handlers from toHandlers()', () => {
		const handlers = endpoint.toHandlers()

		expect(Array.isArray(handlers)).toBe(true)
		expect(handlers.length).toBe(2)
		expect(typeof handlers[0]).toBe('function')
		expect(typeof handlers[1]).toBe('function')
	})

	it('handles optional body — no body sent', async () => {
		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1] as CallableFunction

		const mockReq = {
			params: {},
			body: undefined,
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

		expect(mockUseCase.execute).toHaveBeenCalledWith(undefined)
		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalledWith({ id: 'session-1' })
	})

	it('handles optional body — name provided', async () => {
		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1] as CallableFunction

		const mockReq = {
			params: {},
			body: { name: 'My Session' },
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

		expect(mockUseCase.execute).toHaveBeenCalledWith('My Session')
		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalledWith({ id: 'session-1' })
	})

	it('returns 200 with { id } response', async () => {
		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1] as CallableFunction

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

	it('returns 500 when useCase throws', async () => {
		;(mockUseCase.execute as Mock).mockRejectedValue(
			new Error('Session creation failed'),
		)

		const handlers = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1] as CallableFunction

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
