import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import WriteFileAdapter from './WriteFile.adapter'

describe('WriteFileAdapter', () => {
	it('creates parent dirs and writes file', async () => {
		const tool = new WriteFileAdapter()
		const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vee-test-'))
		const filePath = path.join(tmpDir, 'nested', 'file.txt')

		const result = await tool.execute(
			JSON.stringify({
				path: filePath,
				content: 'test data',
			}),
		)

		expect(result.content).toMatch('File written successfully')
		expect(await fs.readFile(filePath, 'utf-8')).toBe('test data')
		await fs.rm(tmpDir, { recursive: true })
	})

	it('returns error message on failure', async () => {
		const tool = new WriteFileAdapter()
		const result = await tool.execute(
			JSON.stringify({
				path: '/root/unauthorized/file.txt',
				content: 'data',
			}),
		)
		expect(result.content).toMatch('Error writing file:')
	})

	it('returns error code on invalid args', async () => {
		const tool = new WriteFileAdapter()
		const result = await tool.execute(JSON.stringify({ path: '/x' }))
		expect(result.code).toBe(400)
	})

	it('returns error code on invalid JSON', async () => {
		const tool = new WriteFileAdapter()
		const result = await tool.execute('not-json')
		expect(result.code).toBe(400)
	})
})
