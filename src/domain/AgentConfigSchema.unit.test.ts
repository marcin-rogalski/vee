import { describe, expect, it } from 'vitest'
import { AGENTS_CONFIG_SCHEMA } from './AgentConfigSchema'
import type { JsonSchemaObject, JsonSchemaProperty } from './JsonSchema'
import { isTypedProperty } from './JsonSchema'

describe('AgentConfigSchema', () => {
	it('has top-level object type', () => {
		expect(AGENTS_CONFIG_SCHEMA.type).toBe('object')
	})

	it('requires agents property', () => {
		expect(AGENTS_CONFIG_SCHEMA.required).toContain('agents')
	})

	it('defines agents as array', () => {
		const agentsProp = AGENTS_CONFIG_SCHEMA.properties?.agents
		expect(agentsProp).toBeDefined()
		const prop = agentsProp as JsonSchemaProperty
		expect(isTypedProperty(prop) && prop.type === 'array').toBe(true)
	})

	it('references agentInstance definition', () => {
		const agentsProp = AGENTS_CONFIG_SCHEMA.properties
			?.agents as JsonSchemaProperty
		if (isTypedProperty(agentsProp) && agentsProp.type === 'array') {
			expect(agentsProp.items).toEqual({
				$ref: '#/definitions/agentInstance',
			})
		} else {
			throw new Error('agents property should be an array type')
		}
	})

	it('defines agentInstance with required fields', () => {
		const agentDef = AGENTS_CONFIG_SCHEMA.definitions
			?.agentInstance as JsonSchemaObject
		expect(agentDef.required).toContain('id')
		expect(agentDef.required).toContain('name')
		expect(agentDef.required).toContain('providerId')
		expect(agentDef.required).toContain('systemPrompt')
	})

	it('defines agentInstance optional fields', () => {
		const agentDef = AGENTS_CONFIG_SCHEMA.definitions
			?.agentInstance as JsonSchemaObject
		expect(agentDef.properties?.description).toBeDefined()
		expect(agentDef.properties?.providerOverrides).toBeDefined()
		expect(agentDef.properties?.toolIds).toBeDefined()
	})

	it('defines toolIds as string array', () => {
		const agentDef = AGENTS_CONFIG_SCHEMA.definitions
			?.agentInstance as JsonSchemaObject
		const toolIds = agentDef.properties?.toolIds as JsonSchemaProperty
		if (isTypedProperty(toolIds) && toolIds.type === 'array') {
			expect(toolIds.items).toEqual({ type: 'string' })
		} else {
			throw new Error('toolIds property should be an array type')
		}
	})

	it('does not allow additional properties at top level', () => {
		expect(AGENTS_CONFIG_SCHEMA.additionalProperties).toBe(false)
	})

	it('does not allow additional properties on agentInstance', () => {
		const agentDef = AGENTS_CONFIG_SCHEMA.definitions
			?.agentInstance as JsonSchemaObject
		expect(agentDef.additionalProperties).toBe(false)
	})
})
