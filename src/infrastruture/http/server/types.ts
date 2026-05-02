import type Zod from "zod";
import type Endpoint from "./endpoint";
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

export type AnyEndpoint = Endpoint<HttpMethod, string, any, any, any, any>;
