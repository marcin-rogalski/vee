import * as http from 'node:http'
import * as net from 'node:net'

/**
 * Mock OpenAI-compatible streaming server for E2E tests.
 *
 * Responds to POST /v1/chat/completions with Server-Sent Events (NDJSON)
 * streaming tokens character by character, mimicking the OpenAI API.
 */
export class MockOpenAIServer {
	private server: http.Server | null = null
	public port = 0

	constructor(
		private readonly responses: string[] = ['Hello, world!'],
	) {}

	/** Find an available port and start the server. */
	async start(): Promise<number> {
		return new Promise((resolve, reject) => {
			this.server = http.createServer((req, res) => {
				if (req.url === '/v1/chat/completions' && req.method === 'POST') {
					this.handleChatCompletions(req, res)
				} else {
					res.writeHead(404)
					res.end()
				}
			})

			// Start on port 0 to get an ephemeral port
			this.server!.listen(0, () => {
				const addr = this.server!.address()
				if (addr && typeof addr === 'object') {
					this.port = addr.port
					resolve(this.port)
				} else {
					reject(new Error('Failed to get server port'))
				}
			})

			this.server!.on('error', reject)
		})
	}

	/** Stop the server and wait for connections to close. */
	async stop(): Promise<void> {
		return new Promise((resolve) => {
			if (this.server) {
				this.server.close(() => resolve())
				this.server = null
			} else {
				resolve()
			}
		})
	}

	/** Set the next response(s) the server will return. */
	setResponse(response: string): void {
		this.responses.length = 0
		this.responses.push(response)
	}

	private handleChatCompletions(_req: http.ServerRequest, res: http.ServerResponse): void {
		const response = this.responses.shift() ?? 'OK'

		// Set headers for Server-Sent Events streaming
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		})

		// Stream tokens character by character (like OpenAI does)
		let charIndex = 0
		const streamToken = () => {
			if (charIndex < response.length) {
				const chunk = response[charIndex]
				res.write(
					`data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":${Date.now()},"model":"test-model","choices":[{"index":0,"delta":{"content":"${chunk}"},"finish_reason":null}]}\n\n`,
				)
				charIndex++
				setTimeout(streamToken, 10) // Small delay to simulate streaming
			} else {
				// Send final chunk with finish_reason
				res.write(
					`data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":${Date.now()},"model":"test-model","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n`,
				)
				res.write('data: [DONE]\n\n')
				res.end()
			}
		}

		streamToken()
	}
}

/** Find an available TCP port. */
export function findAvailablePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = net.createServer()
		server.listen(0, () => {
			const addr = server.address()
			if (addr && typeof addr === 'object') {
				server.close(() => resolve(addr.port))
			} else {
				reject(new Error('Failed to get port'))
			}
		})
		server.on('error', reject)
	})
}
