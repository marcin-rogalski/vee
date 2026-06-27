/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */

import type EventBusPort from '@application/ports/EventBus.port'
import type { Envelope } from '@application/ports/EventBus.port'
import type { RequestHandler } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EventsSSE from './EventsSSE.adapter'

describe('EventsSSE', () => {
	let mockEventBus: EventBusPort
	let endpoint: import('@infrastructure/utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		const mockStream = {
			next: vi.fn(),
			return: vi.fn(),
			throw: vi.fn(),
			[Symbol.asyncIterator]: function () {
				return this
			},
			unsubscribe: vi.fn(),
		} as unknown as AsyncGenerator<Envelope> & { unsubscribe: () => void }

		mockEventBus = {
			publish: vi.fn(),
			subscribe: vi.fn().mockReturnValue(mockStream),
		} as unknown as EventBusPort

		endpoint = EventsSSE(mockEventBus)
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('GET')
		expect(endpoint.path).toBe('/events')
	})

	it('returns 2 handlers from toHandlers()', () => {
		const handlers = endpoint.toHandlers()

		expect(Array.isArray(handlers)).toBe(true)
		expect(handlers.length).toBe(2)
		expect(typeof handlers[0]).toBe('function')
		expect(typeof handlers[1]).toBe('function')
	})

	it('streams SSE events for AsyncGenerator output', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		let closeCallback: () => void = () => {}

		const mockReq = {
			params: {},
			body: {},
			query: {},
			on: vi.fn().mockImplementation((event: string, cb: () => void) => {
				if (event === 'close') {
					closeCallback = cb
				}
			}),
		} as any

		const mockRes = {
			setHeader: vi.fn(),
			write: vi.fn(),
			end: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		// Create a proper async iterator that immediately returns done
		let callCount = 0
		const mockStream = {
			next: vi.fn(() => {
				callCount++
				return callCount === 1
					? { value: { type: 'test', data: 'test' }, done: false }
					: { value: undefined, done: true }
			}),
			return: vi.fn(),
			throw: vi.fn(),
			[Symbol.asyncIterator]: function () {
				return this
			},
			unsubscribe: vi.fn(),
		}
		vi.spyOn(mockEventBus, 'subscribe').mockReturnValue(mockStream as any)

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		closeCallback()
		await promise

		expect(mockRes.setHeader).toHaveBeenCalledWith(
			'Content-Type',
			'text/event-stream',
		)
		expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache')
		expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive')
		expect(mockRes.end).toHaveBeenCalled()
	})

	it('calls eventBus.subscribe() on request', () => {
		const handlers = endpoint.toHandlers()
		// Trigger the handler to call subscribe
		const mockReq = {
			params: {},
			body: {},
			query: {},
			on: vi.fn(),
		} as any
		const mockRes = {
			setHeader: vi.fn(),
			write: vi.fn(),
			end: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any
		handlers[1]?.(mockReq, mockRes, vi.fn())

		expect(mockEventBus.subscribe).toHaveBeenCalled()
	})

	it('returns 500 when stream throws', async () => {
		const handlers: RequestHandler[] = endpoint.toHandlers()
		const dispatchMiddleware = handlers[1]

		const mockReq = {
			params: {},
			body: {},
			query: {},
			on: vi.fn(),
		} as any

		const mockRes = {
			setHeader: vi.fn(),
			write: vi.fn(),
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
			end: vi.fn(),
		} as any

		// Create a stream that throws on next()
		const throwingStream = {
			next: vi.fn(() => Promise.reject(new Error('Stream error'))),
			return: vi.fn(),
			throw: vi.fn(),
			[Symbol.asyncIterator]: function () {
				return this
			},
			unsubscribe: vi.fn(),
		} as unknown as AsyncGenerator<Envelope> & { unsubscribe: () => void }
		vi.spyOn(mockEventBus, 'subscribe').mockReturnValue(throwingStream as any)

		const next = vi.fn()
		const promise = dispatchMiddleware?.(mockReq, mockRes, next)
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(500)
		expect(mockRes.json).toHaveBeenCalled()
	})
})
