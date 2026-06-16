import { describe, expect, it } from 'vitest'
import type { JsonSchemaObject, JsonSchemaProperty } from './JsonSchema'
import { isTypedProperty } from './JsonSchema'
import { PROVIDERS_CONFIG_SCHEMA } from './ProviderConfigSchema'

const requireDef = (def: JsonSchemaObject | undefined): JsonSchemaObject => {
	expect(def).toBeDefined()
	return def as JsonSchemaObject
}

const requireProp = (
	prop: JsonSchemaProperty | undefined,
): JsonSchemaProperty => {
	expect(prop).toBeDefined()
	return prop as JsonSchemaProperty
}

describe('ProviderConfigSchema', () => {
	it('exports a valid JSON Schema object', () => {
		expect(PROVIDERS_CONFIG_SCHEMA.$schema).toBe(
			'https://json-schema.org/draft/2020-12/schema',
		)
		expect(PROVIDERS_CONFIG_SCHEMA.type).toBe('object')
		expect(PROVIDERS_CONFIG_SCHEMA.description).toBe(
			'Vee providers configuration file',
		)
	})

	it('requires the providers property', () => {
		expect(PROVIDERS_CONFIG_SCHEMA.required).toEqual(['providers'])
	})

	it('defines providers as an array type', () => {
		const providersProp = requireProp(
			PROVIDERS_CONFIG_SCHEMA.properties.providers,
		)
		if (isTypedProperty(providersProp)) {
			expect(providersProp.type).toBe('array')
		} else {
			throw new Error('providers prop should have a type')
		}
	})

	it('references providerInstance definition for array items', () => {
		const providersProp = requireProp(
			PROVIDERS_CONFIG_SCHEMA.properties.providers,
		)
		if (isTypedProperty(providersProp) && providersProp.type === 'array') {
			expect(providersProp.items).toEqual({
				$ref: '#/definitions/providerInstance',
			})
		} else {
			throw new Error('providers is not an array')
		}
	})

	it('defines providerInstance with required fields', () => {
		const def = requireDef(
			PROVIDERS_CONFIG_SCHEMA.definitions?.providerInstance,
		)
		expect(def.required).toEqual([
			'id',
			'name',
			'type',
			'configSchema',
			'config',
		])
	})

	it('providerInstance defines id, name, type as strings', () => {
		const def = requireDef(
			PROVIDERS_CONFIG_SCHEMA.definitions?.providerInstance,
		)
		const idProp = def.properties.id
		if (idProp && isTypedProperty(idProp)) {
			expect(idProp.type).toBe('string')
		}
		const nameProp = def.properties.name
		if (nameProp && isTypedProperty(nameProp)) {
			expect(nameProp.type).toBe('string')
		}
		const typeProp = def.properties.type
		if (typeProp && isTypedProperty(typeProp)) {
			expect(typeProp.type).toBe('string')
		}
	})

	it('providerInstance references jsonSchemaObject for configSchema and config', () => {
		const def = requireDef(
			PROVIDERS_CONFIG_SCHEMA.definitions?.providerInstance,
		)
		expect(def.properties.configSchema).toEqual({
			$ref: '#/definitions/jsonSchemaObject',
		})
		expect(def.properties.config).toEqual({
			$ref: '#/definitions/jsonSchemaObject',
		})
	})

	it('defines jsonSchemaObject as a generic object definition', () => {
		const def = requireDef(
			PROVIDERS_CONFIG_SCHEMA.definitions?.jsonSchemaObject,
		)
		expect(def.type).toBe('object')
		expect(def.properties).toHaveProperty('$schema')
		expect(def.properties).toHaveProperty('type')
		expect(def.properties).toHaveProperty('properties')
		expect(def.properties).toHaveProperty('required')
	})
})
