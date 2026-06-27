import { z } from 'zod'
import { ValidationError } from './errors'
import type { JsonSchemaObject } from './JsonSchema'

export type ProviderData = {
	id: string
	name: string
	type: string
	configSchema: JsonSchemaObject
	config: Record<string, unknown>
}

export class Provider {
	static readonly schema = z.object({
		id: z.string().default(() => crypto.randomUUID()),
		name: z.string().trim().min(1),
		type: z.string().trim().min(1),
		configSchema: z.custom<JsonSchemaObject>().default({
			$schema: 'http://json-schema.org/draft-07/schema#',
			type: 'object',
			properties: {},
		}),
		config: z.record(z.string(), z.unknown()).default({}),
	})

	readonly id: string
	readonly type: string
	private _name: string
	private _configSchema: JsonSchemaObject
	private _config: Record<string, unknown>

	constructor(input: {
		name?: string
		type: string
		id?: string
		configSchema?: JsonSchemaObject
		config?: Record<string, unknown>
	}) {
		try {
			const result = Provider.schema.parse(input)
			this.id = result.id
			this._name = result.name
			this.type = result.type
			this._configSchema = result.configSchema
			this._config = result.config
		} catch (error) {
			if (error instanceof z.ZodError) {
				const details: Record<string, string> = {}
				for (const issue of error.issues) {
					const path = issue.path.join('.')
					details[path] = issue.message
				}
				throw new ValidationError(details)
			}
			throw error
		}
	}

	get name(): string {
		return this._name
	}

	get configSchema(): JsonSchemaObject {
		return this._configSchema
	}

	get config(): Record<string, unknown> {
		return this._config
	}

	rename(newName: string): void {
		const trimmed = newName.trim()
		if (trimmed.length === 0) {
			throw new ValidationError({ name: 'Name cannot be empty' })
		}
		this._name = trimmed
	}

	setConfig(config: Record<string, unknown>): void {
		this._config = config
	}

	setConfigSchema(schema: JsonSchemaObject): void {
		this._configSchema = schema
	}

	toData(): ProviderData {
		return {
			id: this.id,
			name: this._name,
			type: this.type,
			configSchema: this._configSchema,
			config: this._config,
		}
	}
}

export default Provider
