/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */
import type { RequestHandler } from 'express'
import { describe, expect, it, vi } from 'vitest'
import Zod from 'zod'
import ExpressEndpoint from './ExpressEndpoint.adapter'

const { createEndpoint } = ExpressEndpoint

describe('ExpressEndpoint', () => {
	it('returns object with method, path, toHandlers', () => {
		const endpoint = createEndpoint('GET', '/health', {}, async () => {
			return { status: 'ok' }
		})

		expect(endpoint.method).toBe('GET')
		expect(endpoint.path).toBe('/health')
		expect(typeof endpoint.toHandlers).toBe('function')
	})

	it('extracts path parameters: /agents/{id:string}', () => {
		const endpoint = createEndpoint(
			'GET',
			'/agents/{id:string}',
			{ params: Zod.object({ id: Zod.string() }) },
			async (params) => {
				return { id: params.id }
			},
		)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const validationMiddleware = handlers[0]

		const mockReq = {
			params: { id: 'agent-1' },
			query: {},
			body: {},
		} as any
		const mockRes = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any
		const next = vi.fn()

		validationMiddleware?.(mockReq, mockRes, next)

		expect(next).toHaveBeenCalled()
		expect(mockReq.params).toEqual({ id: 'agent-1' })
	})

	it('extracts path parameters: /agents/{id:string}/items/{itemId:number}', () => {
		const endpoint = createEndpoint(
			'GET',
			'/agents/{id:string}/items/{itemId:number}',
			{
				params: Zod.object({
					id: Zod.string(),
					itemId: Zod.number(),
				}) as any,
			},
			async (params) => {
				return { id: params.id, itemId: params.itemId }
			},
		)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const validationMiddleware = handlers[0]

		const mockReq = {
			params: { id: 'agent-1', itemId: 42 },
			query: {},
			body: {},
		} as any
		const mockRes = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any
		const next = vi.fn()

		validationMiddleware?.(mockReq, mockRes, next)

		expect(next).toHaveBeenCalled()
		expect(mockReq.params).toEqual({ id: 'agent-1', itemId: 42 })
	})

	it('handles path without params', () => {
		const endpoint = createEndpoint('GET', '/health', {}, async () => {
			return { status: 'ok' }
		})

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const validationMiddleware = handlers[0]

		const mockReq = {
			params: {},
			query: {},
			body: {},
		} as any
		const mockRes = {} as any
		const next = vi.fn()

		validationMiddleware?.(mockReq, mockRes, next)

		expect(next).toHaveBeenCalled()
	})

	it('rejects invalid path params with 400', () => {
		const endpoint = createEndpoint(
			'GET',
			'/agents/{id:string}',
			{ params: Zod.object({ id: Zod.string() }) },
			async (params) => {
				return { id: params.id }
			},
		)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const validationMiddleware = handlers[0]

		const mockReq = {
			params: { id: 123 },
			query: {},
			body: {},
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

	it('rejects invalid body with 400', () => {
		const endpoint = createEndpoint(
			'POST',
			'/agents',
			{ body: Zod.object({ name: Zod.string() }) },
			async (_params, body) => {
				return { name: body.name }
			},
		)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const validationMiddleware = handlers[0]

		const mockReq = {
			params: {},
			query: {},
			body: { name: 123 },
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

	it('rejects invalid query with 400', () => {
		const endpoint = createEndpoint(
			'GET',
			'/agents',
			{ query: Zod.object({ limit: Zod.coerce.number() }) },
			async (_params, _body, query) => {
				return { limit: query.limit }
			},
		)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const validationMiddleware = handlers[0]

		const mockReq = {
			params: {},
			query: { limit: 'not-a-number' },
			body: {},
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

	it('passes valid requests to next', () => {
		const endpoint = createEndpoint(
			'POST',
			'/agents',
			{
				body: Zod.object({ name: Zod.string() }),
				query: Zod.object({ limit: Zod.coerce.number() }),
			},
			async (_params, body, query) => {
				return { name: body.name, limit: query.limit }
			},
		)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const validationMiddleware = handlers[0]

		const mockReq = {
			params: {},
			query: { limit: '10' },
			body: { name: 'test' },
		} as any
		const mockRes = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any
		const next = vi.fn()

		validationMiddleware?.(mockReq, mockRes, next)

		expect(next).toHaveBeenCalled()
		expect(mockReq.body).toEqual({ name: 'test' })
		expect(mockReq.query).toEqual({ limit: 10 })
	})

	it('returns 204 for undefined/null output', async () => {
		const endpoint = createEndpoint(
			'DELETE',
			'/agents/{id:string}',
			{ params: Zod.object({ id: Zod.string() }) },
			async (_params) => {
				return undefined
			},
		)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		let closeCallback: () => void = () => {}
		const mockReq = {
			params: { id: 'agent-1' },
			body: {},
			query: {},
			on: vi.fn().mockImplementation((event: string, cb: () => void) => {
				if (event === 'close') closeCallback = cb
			}),
		} as any
		const mockRes = {
			sendStatus: vi.fn(),
		} as any

		// First let the handler start executing
		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		// Then trigger close to abort
		closeCallback()
		// Wait for completion
		await promise

		expect(mockRes.sendStatus).toHaveBeenCalledWith(204)
	})

	it('returns JSON for object output', async () => {
		const endpoint = createEndpoint('GET', '/health', {}, async () => {
			return { status: 'ok' }
		})

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		let closeCallback: () => void = () => {}
		const mockReq = {
			params: {},
			body: {},
			query: {},
			on: vi.fn().mockImplementation((event: string, cb: () => void) => {
				if (event === 'close') closeCallback = cb
			}),
		} as any
		const mockRes = {
			setHeader: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		// First let the handler start executing
		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		// Then trigger close to abort
		closeCallback()
		// Wait for completion
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalledWith({ status: 'ok' })
	})

	it('streams SSE for AsyncGenerator output', async () => {
		const endpoint = createEndpoint(
			'POST',
			'/infer',
			{ sse: Zod.object({ type: Zod.string(), data: Zod.any() }) },
			async function* () {
				yield { type: 'token', data: 'Hello' }
				yield { type: 'token', data: 'World' }
			},
		)

		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		let closeCallback: () => void = () => {}
		const mockReq = {
			params: {},
			body: {},
			query: {},
			on: vi.fn().mockImplementation((event: string, cb: () => void) => {
				if (event === 'close') closeCallback = cb
			}),
		} as any
		const mockRes = {
			setHeader: vi.fn(),
			write: vi.fn(),
			end: vi.fn(),
		} as any

		// First let the handler start executing
		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		// Then trigger close to abort
		closeCallback()
		// Wait for completion
		await promise

		expect(mockRes.setHeader).toHaveBeenCalledWith(
			'Content-Type',
			'text/event-stream',
		)
		expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache')
		expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive')
		expect(mockRes.write).toHaveBeenCalled()
		expect(mockRes.end).toHaveBeenCalled()
	})

	it('toHandlers returns array of Express middleware functions', () => {
		const endpoint = createEndpoint('GET', '/health', {}, async () => {
			return { status: 'ok' }
		})

		const handlers = endpoint.toHandlers()

		expect(Array.isArray(handlers)).toBe(true)
		expect(handlers.length).toBe(2)
		expect(typeof handlers[0]).toBe('function')
		expect(typeof handlers[1]).toBe('function')
	})
})
