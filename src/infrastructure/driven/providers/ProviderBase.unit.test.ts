import type { JsonSchemaObject } from '@domain/JsonSchema'
import { describe, expect, it } from 'vitest'
import ProviderBase from './ProviderBase'

/** Minimal concrete subclass for testing ProviderBase defaults. */
class TestProvider extends ProviderBase {
	readonly id = 'test'
	override type = 'test'

	static override CONFIG_SCHEMA = {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		type: 'object' as const,
		properties: {
			key: { type: 'string', description: 'A key' },
		},
		required: ['key'],
	} as unknown as JsonSchemaObject

	infer() {
		return (async function* () {})()
	}
}

describe('ProviderBase', () => {
	it('has default countTokens returning 0', () => {
		const provider = new TestProvider()
		expect(
			provider.countTokens({ id: '1', ts: 0, role: 'user', content: 'hi' }),
		).toBe(0)
	})

	it('has default shouldCompact returning false', () => {
		const provider = new TestProvider()
		expect(provider.shouldCompact([])).toBe(false)
	})

	it('has default compact returning empty array', async () => {
		const provider = new TestProvider()
		const result = await provider.compact([])
		expect(result).toEqual([])
	})

	it('exposes CONFIG_SCHEMA as static property', () => {
		expect(TestProvider.CONFIG_SCHEMA.type).toBe('object')
		expect(TestProvider.CONFIG_SCHEMA.properties).toHaveProperty('key')
		expect(TestProvider.CONFIG_SCHEMA.required).toEqual(['key'])
	})
})
