/** biome-ignore-all lint/complexity/noBannedTypes: usage of {} is intended here */
import type { RequestHandler } from "express";
import Zod, { type Schema } from "zod";
import type { HttpMethod, HttpParameters } from "./types";

Zod.object({});

export default class Endpoint<
	Method extends HttpMethod,
	Path extends string,
	Params extends object = HttpParameters<Path>,
	Query extends object = never,
	Body extends object = never,
	Response extends object = never,
> {
	handlers: RequestHandler<any, any, any, any>[] = [];

	constructor(
		readonly method: Method,
		readonly path: Path,
		readonly schemas: {
			query?: Schema<Query>;
			body?: Schema<Body>;
			response?: Schema<Response>;
		} & ({} extends Params ? { params?: never } : { params: Schema<Params> }),

		...handlers: RequestHandler<Params, Response, Body, Query>[]
	) {
		this.handlers.push((req, res, next) => {
			if (this.schemas.params) {
				const result = this.schemas.params.safeParse(req.params);

				if (!result.success) {
					res.status(400).json({
						error: "Invalid path parameters",
						details: Zod.treeifyError(result.error),
					});

					return;
				}

				req.params = result.data;
			}

			if (this.schemas.query) {
				const result = this.schemas.query.safeParse(req.query);

				if (!result.success) {
					res.status(400).json({
						error: "Invalid query parameters",
						details: Zod.treeifyError(result.error),
					});
					return;
				}

				req.query = result.data;
			}

			if (this.schemas.body) {
				const result = this.schemas.body.safeParse(req.body);

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
		});

		this.handlers.push(...handlers);
	}
}
