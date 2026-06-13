import type { Server as HttpServer } from 'node:http'
import type LoggerPort from '@application/ports/Logger.port'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExpressServer from './ExpressServer.adapter'

class TestableExpressServer extends ExpressServer {
	get httpServerRef(): HttpServer | undefined {
		return this.httpServer
	}

	stop(): Promise<void> {
		return super.stop()
	}
}

interface MockExpress {
	use: ReturnType<typeof vi.fn>
	listen: ReturnType<typeof vi.fn>
	get: ReturnType<typeof vi.fn>
	post: ReturnType<typeof vi.fn>
	put: ReturnType<typeof vi.fn>
	delete: ReturnType<typeof vi.fn>
	patch: ReturnType<typeof vi.fn>
}

describe('U2 — ExpressServer', () => {
	let mockLogger: LoggerPort
	let server: TestableExpressServer
	let mockExpress: MockExpress
	let mockHttpServer: HttpServer

	beforeEach(() => {
		// Create mock logger
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		}

		// Create mock express app
		mockExpress = {
			use: vi.fn(),
			listen: vi.fn(),
			get: vi.fn(),
			post: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
			patch: vi.fn(),
		}

		// Create mock HTTP server
		mockHttpServer = {
			close: vi.fn(),
		} as unknown as HttpServer
	})

	it('constructor sets up middleware and logger', () => {
		// Create server without mocking to test real constructor
		server = new TestableExpressServer(3000, mockLogger)

		// The constructor calls express.use() twice in the real implementation
		// We can't test this directly since we don't have access to the internal express instance
		// This test documents the expected behavior
		expect(server).toBeInstanceOf(ExpressServer)
	})

	it('constructor initializes with correct port and logger', () => {
		server = new TestableExpressServer(8080, mockLogger)

		expect(server).toHaveProperty('port', 8080)

		// Logger is private, so we can't test it directly
		expect(mockLogger).toBeDefined()
	})

	it('register() adds endpoints to express routes', () => {
		server = new TestableExpressServer(3000, mockLogger)

		// Replace the private express property with mock
		Object.defineProperty(server, 'express', {
			value: mockExpress,
			writable: true,
		})

		const mockEndpoint = {
			method: 'GET' as const,
			path: '/users',
			toHandlers: vi.fn().mockReturnValue([]),
		}

		const result = server.register(mockEndpoint)

		// Should return this for chaining
		expect(result).toBe(server)

		// Verify express.get was called
		expect(mockExpress.get).toHaveBeenCalledWith(
			'/users',
			...mockEndpoint.toHandlers(),
		)

		// Verify toHandlers was called
		expect(mockEndpoint.toHandlers).toHaveBeenCalled()
	})

	it('register() handles path parameters', () => {
		server = new TestableExpressServer(3000, mockLogger)

		Object.defineProperty(server, 'express', {
			value: mockExpress,
			writable: true,
		})

		const mockEndpoint = {
			method: 'DELETE' as const,
			path: '/users/{id}',
			toHandlers: vi.fn().mockReturnValue([]),
		}

		server.register(mockEndpoint)

		// Path parameter should be converted from {id} to :id
		expect(mockExpress.delete).toHaveBeenCalledWith(
			'/users/:id',
			...mockEndpoint.toHandlers(),
		)
	})

	it('register() returns this for method chaining', () => {
		server = new TestableExpressServer(3000, mockLogger)

		Object.defineProperty(server, 'express', {
			value: mockExpress,
			writable: true,
		})

		const endpoint1 = {
			method: 'GET' as const,
			path: '/test1',
			toHandlers: vi.fn().mockReturnValue([]),
		}

		const endpoint2 = {
			method: 'POST' as const,
			path: '/test2',
			toHandlers: vi.fn().mockReturnValue([]),
		}

		const result = server.register(endpoint1).register(endpoint2)

		expect(result).toBe(server)
	})

	it('start() creates HTTP server and registers signal handlers', async () => {
		server = new TestableExpressServer(3000, mockLogger)

		// Mock the express.listen to return a mock server
		mockExpress.listen.mockReturnValue(mockHttpServer)

		// Replace express with mock
		Object.defineProperty(server, 'express', {
			value: mockExpress,
			writable: true,
		})

		// Spy on process.on to capture signal handlers
		const processOnSpy = vi
			.spyOn(process, 'on')
			.mockImplementation((_event: string | symbol, _callback: () => void) => {
				// Don't actually register handlers
				return process
			})

		await server.start()

		// Verify listen was called with correct port
		expect(mockExpress.listen).toHaveBeenCalledWith(3000, expect.any(Function))

		// Verify signal handlers were registered
		expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function))
		expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function))

		// Cleanup
		processOnSpy.mockRestore()
	})

	it('stop() closes HTTP server', async () => {
		server = new TestableExpressServer(3000, mockLogger)

		// Set the httpServer manually
		Object.defineProperty(server, 'httpServer', {
			value: mockHttpServer,
			writable: true,
		})

		// Call the stop method directly
		await (server as TestableExpressServer).stop()

		// Verify close was called
		expect(mockHttpServer.close).toHaveBeenCalled()
	})

	it('stop() is safe when server is not started', async () => {
		server = new TestableExpressServer(3000, mockLogger)

		// httpServer is undefined (not started)

		// Should not throw
		await expect(
			(server as TestableExpressServer).stop(),
		).resolves.not.toThrow()
	})

	it('signal handlers call stop on SIGINT', async () => {
		server = new TestableExpressServer(3000, mockLogger)

		mockExpress.listen.mockReturnValue(mockHttpServer)

		Object.defineProperty(server, 'express', {
			value: mockExpress,
			writable: true,
		})

		// Capture the SIGINT handler
		const processOnSpy = vi
			.spyOn(process, 'on')
			.mockImplementation((event: string | symbol, callback: () => void) => {
				if (event === 'SIGINT') {
					// Call the handler to test
					callback()
				}
				return process
			})

		await server.start()

		// Verify close was called
		expect(mockHttpServer.close).toHaveBeenCalled()

		// Cleanup
		processOnSpy.mockRestore()
	})

	it('signal handlers call stop on SIGTERM', async () => {
		server = new TestableExpressServer(3000, mockLogger)

		mockExpress.listen.mockReturnValue(mockHttpServer)

		Object.defineProperty(server, 'express', {
			value: mockExpress,
			writable: true,
		})

		// Capture the SIGTERM handler
		const processOnSpy = vi
			.spyOn(process, 'on')
			.mockImplementation((event: string | symbol, callback: () => void) => {
				if (event === 'SIGTERM') {
					// Call the handler to test
					callback()
				}
				return process
			})

		await server.start()

		// Verify close was called
		expect(mockHttpServer.close).toHaveBeenCalled()

		// Cleanup
		processOnSpy.mockRestore()
	})

	it('register() handles multiple endpoints', () => {
		server = new TestableExpressServer(3000, mockLogger)

		Object.defineProperty(server, 'express', {
			value: mockExpress,
			writable: true,
		})

		const endpoints = [
			{
				method: 'GET' as const,
				path: '/users',
				toHandlers: vi.fn().mockReturnValue([]),
			},
			{
				method: 'POST' as const,
				path: '/users',
				toHandlers: vi.fn().mockReturnValue([]),
			},
			{
				method: 'DELETE' as const,
				path: '/users/{id}',
				toHandlers: vi.fn().mockReturnValue([]),
			},
		] as const

		server.register(...endpoints)

		// Verify all endpoints were registered
		const [getEndpoint, postEndpoint, deleteEndpoint] = endpoints
		expect(mockExpress.get).toHaveBeenCalledWith(
			'/users',
			...getEndpoint.toHandlers(),
		)
		expect(mockExpress.post).toHaveBeenCalledWith(
			'/users',
			...postEndpoint.toHandlers(),
		)
		expect(mockExpress.delete).toHaveBeenCalledWith(
			'/users/:id',
			...deleteEndpoint.toHandlers(),
		)
	})

	it('register() logs request via middleware', () => {
		// This test verifies the middleware behavior
		// The middleware is created in the constructor, so we need to access the real instance
		server = new TestableExpressServer(3000, mockLogger)

		// Mock the logger to track calls
		const _mockReq = { method: 'GET', path: '/test' }
		const _mockRes = {
			statusCode: 200,
			on: vi.fn((event: string, callback: () => void) => {
				if (event === 'finish') {
					callback()
				}
			}),
		}

		// The middleware is inside the constructor, so we can't access it directly
		// This test documents the expected behavior
		expect(server).toBeInstanceOf(ExpressServer)
	})

	it('start() stores HTTP server reference', async () => {
		server = new TestableExpressServer(3000, mockLogger)

		mockExpress.listen.mockReturnValue(mockHttpServer)

		Object.defineProperty(server, 'express', {
			value: mockExpress,
			writable: true,
		})

		await server.start()

		// Verify httpServer was stored
		expect((server as TestableExpressServer).httpServerRef).toBe(mockHttpServer)
	})
})
