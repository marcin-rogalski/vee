/** biome-ignore-all lint/complexity/noBannedTypes: usage of {} is intended here */
/** biome-ignore-all lint/suspicious/noExplicitAny: usage of any is intneded here */
import type { RequestHandler } from "express";
import Zod from "zod";
import type {
	ExtractBody,
	ExtractOutput,
	ExtractQuery,
	HttpMethod,
	HttpParameters,
} from "./types";

export default class Endpoint {
	readonly method: HttpMethod;
	readonly path: string;
	readonly schemas: unknown;
	// Loosely typed to accommodate both `create` and `typed` handlers without leaking generics.
	private readonly _handler: (...args: any[]) => any;

	protected constructor(
		method: HttpMethod,
		path: string,
		schemas: unknown,
		handler: (...args: any[]) => any,
	) {
		this.method = method;
		this.path = path;
		this.schemas = schemas;
		this._handler = handler;
	}

	static create<TPath extends string, TSchemas>(
		method: HttpMethod,
		path: TPath,
		schemas: TSchemas,
		handler: (
			params: HttpParameters<TPath>,
			body: ExtractBody<TSchemas>,
			query: ExtractQuery<TSchemas>,
			signal: AbortSignal,
		) => ExtractOutput<TSchemas>,
	): Endpoint {
		return new Endpoint(method, path, schemas, handler);
	}

	static typed<TPath extends string, TSchemas>(
		method: HttpMethod,
		path: TPath,
		schemas: TSchemas,
	): abstract new () => Endpoint & {
		handle(
			params: HttpParameters<TPath>,
			body: ExtractBody<TSchemas>,
			query: ExtractQuery<TSchemas>,
			signal: AbortSignal,
		): ExtractOutput<TSchemas> | Promise<ExtractOutput<TSchemas>>;
	} {
		abstract class TypedEndpoint extends Endpoint {
			constructor() {
				// biome-ignore lint: instance must be captured before super() completes
				let instance!: TypedEndpoint;
				super(method, path, schemas, (...args: any[]) =>
					(instance as any).handle(...args),
				);
				instance = this;
			}
			abstract handle(
				params: HttpParameters<TPath>,
				body: ExtractBody<TSchemas>,
				query: ExtractQuery<TSchemas>,
				signal: AbortSignal,
			): ExtractOutput<TSchemas> | Promise<ExtractOutput<TSchemas>>;
		}
		return TypedEndpoint as any;
	}

	toHandlers(): RequestHandler[] {
		const schemas = this.schemas as Record<string, Zod.Schema | undefined>;

		const validationMiddleware: RequestHandler = (req, res, next) => {
			if (schemas.params) {
				const result = schemas.params.safeParse(req.params);

				if (!result.success) {
					res.status(400).json({
						error: "Invalid path parameters",
						details: Zod.treeifyError(result.error),
					});

					return;
				}

				req.params = result.data as Record<string, string>;
			}

			if (schemas.query) {
				const result = schemas.query.safeParse(req.query);

				if (!result.success) {
					res.status(400).json({
						error: "Invalid query parameters",
						details: Zod.treeifyError(result.error),
					});

					return;
				}

				req.query = result.data as Record<string, string>;
			}

			if (schemas.body) {
				const result = schemas.body.safeParse(req.body);

				if (!result.success) {
					res.status(400).json({
						error: "Invalid request body",
						details: Zod.treeifyError(result.error),
					});

					return;
				}

				req.body = result.data;
			}

			next();
		};

		const dispatchMiddleware: RequestHandler = async (req, res) => {
			const controller = new AbortController();

			req.on("close", () => controller.abort());

			let output = this._handler(
				req.params,
				req.body,
				req.query,
				controller.signal,
			);

			if (output instanceof Promise) {
				output = await output;
			}

			if (output === undefined || output === null) {
				res.sendStatus(204);
				return;
			}

			if (
				typeof output === "object" &&
				output !== null &&
				Symbol.asyncIterator in (output as object)
			) {
				res.setHeader("Content-Type", "text/event-stream");
				res.setHeader("Cache-Control", "no-cache");
				res.setHeader("Connection", "keep-alive");

				for await (const event of output as unknown as AsyncIterable<{
					type: string;
					data: unknown;
				}>) {
					res.write(`data: ${JSON.stringify(event)}\n\n`);
				}

				res.end();
				return;
			}

			res.status(200).json(output);
		};

		return [validationMiddleware, dispatchMiddleware];
	}
}
