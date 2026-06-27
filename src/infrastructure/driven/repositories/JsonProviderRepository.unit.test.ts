import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type LoggerPort from '@application/ports/Logger.port'
import type { ProviderData } from '@domain/Provider'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JsonProviderRepository from './JsonProviderRepository'

const noopLogger: LoggerPort = {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {},
}

describe('JsonProviderRepository', () => {
	let tmpDir: string
	let repo: JsonProviderRepository

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), 'vee-test-'))
		repo = new JsonProviderRepository(
			join(tmpDir, 'providers.json'),
			noopLogger,
		)
	})

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true })
	})

	it('save() stores provider, get() retrieves it', async () => {
		const provider: ProviderData = {
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema: {
				$schema: 'http://json-schema.org/draft-07/schema#',
				type: 'object',
				properties: {},
			},
			config: {},
		}
		await repo.save(provider)
		const retrieved = await repo.get('p1')
		expect(retrieved.id).toBe('p1')
		expect(retrieved.name).toBe('OpenAI')
	})

	it('get() throws when provider id not found', async () => {
		await expect(repo.get('nonexistent')).rejects.toThrow(
			'Provider with id nonexistent not found',
		)
	})

	it('list() returns projected { id, name } array', async () => {
		await repo.save({
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema: {
				$schema: 'http://json-schema.org/draft-07/schema#',
				type: 'object',
				properties: {},
			},
			config: {},
		})
		await repo.save({
			id: 'p2',
			name: 'Anthropic',
			type: 'anthropic',
			configSchema: {
				$schema: 'http://json-schema.org/draft-07/schema#',
				type: 'object',
				properties: {},
			},
			config: {},
		})
		const result = await repo.list()
		expect(Array.isArray(result)).toBe(true)
		expect(result).toHaveLength(2)
		expect(result).toContainEqual({ id: 'p1', name: 'OpenAI' })
		expect(result).toContainEqual({ id: 'p2', name: 'Anthropic' })
	})

	it('delete() removes provider', async () => {
		await repo.save({
			id: 'p1',
			name: 'OpenAI',
			type: 'openai',
			configSchema: {
				$schema: 'http://json-schema.org/draft-07/schema#',
				type: 'object',
				properties: {},
			},
			config: {},
		})
		await repo.delete('p1')
		await expect(repo.get('p1')).rejects.toThrow()
	})

	it('save() updates existing provider', async () => {
		await repo.save({
			id: 'p1',
			name: 'Original',
			type: 'openai',
			configSchema: {
				$schema: 'http://json-schema.org/draft-07/schema#',
				type: 'object',
				properties: {},
			},
			config: {},
		})
		await repo.save({
			id: 'p1',
			name: 'Updated',
			type: 'openai',
			configSchema: {
				$schema: 'http://json-schema.org/draft-07/schema#',
				type: 'object',
				properties: {},
			},
			config: { apiKey: 'new-key' },
		})
		const result = await repo.get('p1')
		expect(result.name).toBe('Updated')
		expect(result.config).toEqual({ apiKey: 'new-key' })
	})

	it('persists data across instances', async () => {
		const provider: ProviderData = {
			id: 'p1',
			name: 'Persistent',
			type: 'openai',
			configSchema: {
				$schema: 'http://json-schema.org/draft-07/schema#',
				type: 'object',
				properties: {},
			},
			config: {},
		}
		await repo.save(provider)

		const repo2 = new JsonProviderRepository(
			join(tmpDir, 'providers.json'),
			noopLogger,
		)
		const retrieved = await repo2.get('p1')
		expect(retrieved.name).toBe('Persistent')
	})
})
