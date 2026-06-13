/** biome-ignore-all lint/suspicious/noExplicitAny: it is expected in tests */

import ExpressEndpoint from '@infrastructure/utilities/ExpressEndpoint.adapter'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Health from './Health.adapter'

describe('Health', () => {
	let endpoint: import('@infrastructure/utilities/ExpressEndpoint.adapter').IEndpoint

	beforeEach(() => {
		endpoint = Health()
	})

	it('returns IEndpoint with correct method and path', () => {
		expect(endpoint.method).toBe('GET')
		expect(endpoint.path).toBe('/health')
	})

	it('returns 2 handlers from toHandlers()', () => {
		const handlers = endpoint.toHandlers()

		expect(Array.isArray(handlers)).toBe(true)
		expect(handlers.length).toBe(2)
		expect(typeof handlers[0]).toBe('function')
		expect(typeof handlers[1]).toBe('function')
	})

	it('health handler returns { status: "ok" }', async () => {
		const handlers = endpoint.toHandlers() as unknown as [
			() => void,
			(req: any, res: any, next: any) => Promise<void>,
		]

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
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as any

		const next = vi.fn()
		const promise = handlers[1](mockReq, mockRes, next)
		closeCallback()
		await promise

		expect(mockRes.status).toHaveBeenCalledWith(200)
		expect(mockRes.json).toHaveBeenCalledWith({ status: 'ok' })
	})

	it('returns 500 when handler throws', async () => {
		// This test verifies the ExpressEndpoint error wrapper works
		const failingEndpoint = ExpressEndpoint.createEndpoint(
			'GET',
			'/health-error',
			{},
			async () => {
				throw new Error('Health check failed')
			},
		)

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
		const handlers = failingEndpoint.toHandlers() as unknown as [
			() => void,
			(req: any, res: any, next: any) => Promise<void>,
		]
		const promise2 = handlers[1](mockReq, mockRes, next)
		await promise2

		expect(mockRes.status).toHaveBeenCalledWith(500)
		expect(mockRes.json).toHaveBeenCalled()
	})
})
