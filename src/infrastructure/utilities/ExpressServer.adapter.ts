import type { Server as HttpServer } from 'node:http'
import type LoggerPort from '@application/ports/Logger.port'
import express from 'express'
import type { IEndpoint } from './ExpressEndpoint.adapter'

export default class ExpressServer {
	private express = express()
	protected httpServer: HttpServer | undefined

	protected async stop(): Promise<void> {
		this.httpServer?.close()
	}

	constructor(
		readonly port: number,
		private readonly logger: LoggerPort,
	) {
		this.express.use((req, res, next) => {
			const start = Date.now()

			res.on('finish', () => {
				this.logger.info('http.request', {
					method: req.method,
					path: req.path,
					status: res.statusCode,
					latencyMs: Date.now() - start,
				})
			})

			next()
		})

		this.express.use(express.json())
	}

	register(...endpoints: IEndpoint[]): this {
		for (const endpoint of endpoints) {
			const expressPath = endpoint.path.replace(/\{(\w+)(?::\w+)?\}/g, ':$1')
			this.express[endpoint.method.toLowerCase() as keyof typeof this.express](
				expressPath,
				...endpoint.toHandlers(),
			)
		}
		return this
	}

	async start() {
		this.httpServer = this.express.listen(this.port, () => {})

		process.on('SIGINT', this.stop.bind(this))
		process.on('SIGTERM', this.stop.bind(this))
	}
}
