/** biome-ignore-all lint/complexity/noBannedTypes: usage of {} is intended here */
/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected here to align with standards */
/** biome-ignore-all lint/suspicious/noExplicitAny: usage of any is intneded here */
import type { RequestHandler } from 'express'
import Zod from 'zod'

export interface IEndpoint {
	readonly method: HttpMethodType
	readonly path: string
	toHandlers(): RequestHandler[]
}

/**
 * Helper type to extract path parameters from a URL path string.
 *
 * @example
 * `/agents/{id:string}` → { id: string }
 * `/sessions/{sessionId:string}/entries/{entryId:number}` → { sessionId: string, entryId: number }
 */
type HttpParameters<Path extends string> = Path extends ''
	? {}
	: Path extends `${infer Prefix}/{${infer Param}}${infer Rest}`
		? Param extends `${infer Name}:${infer RawType}`
			? {
					[K in Name]: RawType extends 'number' ? number : string
				} & HttpParameters<`${Prefix}/${Rest}`>
			: { [K in Param]: string } & HttpParameters<`${Prefix}/${Rest}`>
		: Record<string, string>

/**
 * Helper type to extract the output type from a Zod schema.
 * Uses the schema's `Output` type which represents the parsed output.
 */
type ZodOutput<T extends Zod.ZodTypeAny> =
	T extends Zod.ZodType<infer Output> ? Output : unknown

/**
 * Strict schemas type for endpoint definitions.
 * Each key is constrained to produce the correct output type:
 * - `params`: must produce `HttpParameters<Path>` (path parameters)
 * - `body`: optional, any object schema for request body
 * - `query`: optional, any object schema for query parameters
 * - `response`: optional, schema for response type
 * - `sse`: optional, schema for Server-Sent Events streaming
 *
 * @example
 * ```ts
 * const endpoint = createEndpoint('POST', '/agents/{id:string}', {
 *   params: z.object({ id: z.string() }),  // Must produce { id: string }
 *   body: z.object({ name: z.string() }),  // Body schema
 *   response: z.object({ id: z.string() }), // Response schema
 * }, async (params, body, query, signal) => {
 *   // params: { id: string }
 *   // body: { name: string }
 *   // query: {}
 *   // signal: AbortSignal
 *   return { id: 'some-id' }
 * })
 * ```
 */
type StrictEndpointSchemas<Path extends string> = {
	/** Schema that must produce HttpParameters<Path> */
	params?: Zod.ZodType<HttpParameters<Path>>
	/** Optional schema for request body */
	body?: Zod.ZodTypeAny
	/** Optional schema for query parameters */
	query?: Zod.ZodTypeAny
	/** Optional schema for response type */
	response?: Zod.ZodTypeAny
	/** Optional schema for SSE streaming */
	sse?: Zod.ZodTypeAny
}

/**
 * Helper type to extract the body type from strict schemas.
 */
type ExtractBody<TSchemas extends StrictEndpointSchemas<string>> =
	'body' extends keyof TSchemas
		? TSchemas['body'] extends Zod.ZodTypeAny
			? ZodOutput<TSchemas['body']>
			: Record<string, never>
		: Record<string, never>

/**
 * Helper type to extract the query type from strict schemas.
 */
type ExtractQuery<TSchemas extends StrictEndpointSchemas<string>> =
	'query' extends keyof TSchemas
		? TSchemas['query'] extends Zod.ZodTypeAny
			? ZodOutput<TSchemas['query']>
			: Record<string, never>
		: Record<string, never>

/**
 * Helper type to extract the output type from strict schemas.
 */
type ExtractOutput<TSchemas extends StrictEndpointSchemas<string>> =
	'sse' extends keyof TSchemas
		? TSchemas['sse'] extends Zod.ZodTypeAny
			? AsyncGenerator<ZodOutput<TSchemas['sse']>>
			: AsyncGenerator<unknown>
		: 'response' extends keyof TSchemas
			? TSchemas['response'] extends Zod.ZodTypeAny
				? ZodOutput<TSchemas['response']>
				: unknown
			: unknown

class ExpressEndpoint {
	/**
	 * Factory function that creates a typed Express endpoint.
	 *
	 * The factory captures method, path, and schemas as type parameters,
	 * then returns a function that accepts a handler with fully typed parameters.
	 *
	 * @example
	 * ```ts
	 * const endpoint = createEndpoint('POST', '/agents/{id:string}', {
	 *   params: z.object({ id: z.string() }),
	 *   body: z.object({ name: z.string() }),
	 *   response: z.object({ id: z.string() }),
	 * }, async (params, body, query, signal) => {
	 *   // params: { id: string }
	 *   // body: { name: string }
	 *   // query: {}
	 *   // signal: AbortSignal
	 *   return { id: 'some-id' }
	 * })
	 * ```
	 */
	static createEndpoint<
		TPath extends string,
		TSchemas extends StrictEndpointSchemas<TPath>,
	>(
		method: HttpMethodType,
		path: TPath,
		schemas: TSchemas,
		handler: (
			params: HttpParameters<TPath>,
			body: ExtractBody<TSchemas>,
			query: ExtractQuery<TSchemas>,
			signal: AbortSignal,
		) => ExtractOutput<TSchemas> | Promise<ExtractOutput<TSchemas>>,
	): IEndpoint {
		const schemasTyped = schemas as Record<string, Zod.ZodTypeAny | undefined>

		const validationMiddleware: RequestHandler = (req, res, next) => {
			if (schemasTyped.params) {
				const result = schemasTyped.params.safeParse(req.params)

				if (!result.success) {
					res.status(400).json({
						error: 'Invalid path parameters',
						details: Zod.treeifyError(result.error),
					})

					return
				}

				req.params = result.data as Record<string, string>
			}

			if (schemasTyped.query) {
				const result = schemasTyped.query.safeParse(req.query)

				if (!result.success) {
					res.status(400).json({
						error: 'Invalid query parameters',
						details: Zod.treeifyError(result.error),
					})

					return
				}

				req.query = result.data as Record<string, string>
			}

			if (schemasTyped.body) {
				const result = schemasTyped.body.safeParse(req.body)

				if (!result.success) {
					res.status(400).json({
						error: 'Invalid request body',
						details: Zod.treeifyError(result.error),
					})

					return
				}

				req.body = result.data
			}

			next()
		}

		const dispatchMiddleware: RequestHandler = async (req, res) => {
			const controller = new AbortController()

			req.on('close', () => controller.abort())

			let output: unknown
			try {
				output = await handler(
					req.params as HttpParameters<TPath>,
					req.body as ExtractBody<TSchemas>,
					req.query as ExtractQuery<TSchemas>,
					controller.signal,
				)
			} catch (error) {
				res.status(500).json({
					error: 'Internal server error',
					details: error instanceof Error ? error.message : 'Unknown error',
				})
				return
			}

			if (output === undefined || output === null) {
				res.sendStatus(204)
				return
			}

			if (
				typeof output === 'object' &&
				output !== null &&
				Symbol.asyncIterator in (output as object)
			) {
				res.setHeader('Content-Type', 'text/event-stream')
				res.setHeader('Cache-Control', 'no-cache')
				res.setHeader('Connection', 'keep-alive')

				try {
					for await (const event of output as unknown as AsyncGenerator<{
						type: string
						data: unknown
					}>) {
						res.write(`data: ${JSON.stringify(event)}\n\n`)
					}
				} catch (error) {
					res.status(500).json({
						error: 'Internal server error',
						details: error instanceof Error ? error.message : 'Unknown error',
					})
					return
				}

				res.end()
				return
			}

			res.status(200).json(output)
		}

		return {
			method,
			path,
			toHandlers: () => [validationMiddleware, dispatchMiddleware],
		}
	}
}

export default ExpressEndpoint

type HttpMethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
