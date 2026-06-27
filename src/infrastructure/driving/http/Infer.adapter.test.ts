/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */
import type InferHandler from '@infrastructure/driving/handlers/InferHandler'
import type { RequestHandler } from 'express'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import Infer from './Infer.adapter'

describe('Infer', () => {
	let mockHandler: InferHandler
	let endpoint: import('@infrastructure/utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		mockHandler = {
			execute: vi.fn().mockResolvedValue(undefined),
		} as unknown as InferHandler
		endpoint = Infer(mockHandler)
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('POST')
		expect(endpoint.path).toBe('/infer')
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

	it('calls useCase.execute(prompt, agentId, sessionId)', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		let closeCallback: () => void = () => {}
		const mockReq = {
			params: {},
			body: { prompt: 'hi', agentId: 'a1', sessionId: 's1' },
			query: {},
			on: vi.fn().mockImplementation((event: string, cb: () => void) => {
				if (event === 'close') {
					closeCallback = cb
				}
			}),
		} as any
		const mockRes = {
			sendStatus: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		closeCallback()
		await promise

		expect(mockHandler.execute).toHaveBeenCalledWith('hi', 'a1', 's1')
	})

	it('returns 204 when useCase returns void', async () => {
		;(mockHandler.execute as Mock).mockResolvedValue(undefined)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		let closeCallback: () => void = () => {}
		const mockReq = {
			params: {},
			body: { prompt: 'hi', agentId: 'a1', sessionId: 's1' },
			query: {},
			on: vi.fn().mockImplementation((event: string, cb: () => void) => {
				if (event === 'close') {
					closeCallback = cb
				}
			}),
		} as any
		const mockRes = {
			sendStatus: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		closeCallback()
		await promise

		expect(mockRes.sendStatus).toHaveBeenCalledWith(204)
	})

	it('returns 500 when useCase throws', async () => {
		;(mockHandler.execute as Mock).mockRejectedValue(
			new Error('Inference failed'),
		)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		let closeCallback: () => void = () => {}
		const mockReq = {
			params: {},
			body: { prompt: 'hi', agentId: 'a1', sessionId: 's1' },
			query: {},
			on: vi.fn().mockImplementation((event: string, cb: () => void) => {
				if (event === 'close') {
					closeCallback = cb
				}
			}),
		} as any
		const mockRes = {
			sendStatus: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		closeCallback()
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(500)
		expect(mockRes.json).toHaveBeenCalled()
	})
})
