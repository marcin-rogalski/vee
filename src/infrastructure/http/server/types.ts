import type Zod from "zod";
import type { RequestHandler } from "express";
import type { HTTP_METHOD_SCHEMA } from "./schemas";

export type HttpMethod = Zod.infer<typeof HTTP_METHOD_SCHEMA>;

export type HttpParameters<Path extends string> =
	Path extends `${infer Prefix extends string}/${infer Suffix extends string}`
		? HttpParameters<Prefix> & HttpParameters<Suffix>
		: Path extends `{${infer Param extends string}}`
			? Param extends `${infer Name}:${infer Type extends HttpParameterType}`
				? { [K in Name]: InferHttpParameterType<Type> }
				: { [K in Param]: string }
			: {};

type HttpParameterType = "string" | "number";
type InferHttpParameterType<T extends HttpParameterType> = T extends "string"
	? string
	: T extends "number"
		? number
		: any;

export type EndpointSchemas<R = never, E = never> =
	| { response: Zod.Schema<R>; sse?: never }
	| { sse: Zod.Schema<E>; response?: never }
	| { response?: never; sse?: never };

export type SchemaFor<Output> = Output extends AsyncGenerator<infer E>
	? EndpointSchemas<never, E>
	: Output extends void
		? EndpointSchemas<never, never>
		: EndpointSchemas<Output, never>;

export type ExtractBody<TSchemas> =
	TSchemas extends { body: Zod.Schema<infer B> } ? B : Record<string, never>;

export type ExtractQuery<TSchemas> =
	TSchemas extends { query: Zod.Schema<infer Q> } ? Q : Record<string, never>;

export type ExtractOutput<TSchemas> =
	TSchemas extends { sse: Zod.Schema<infer E> }
		? AsyncGenerator<E>
		: TSchemas extends { response: Zod.Schema<infer R> }
		? R
		: void;

export type AnyEndpoint = {
	method: HttpMethod;
	path: string;
	toHandlers(): RequestHandler[];
};
