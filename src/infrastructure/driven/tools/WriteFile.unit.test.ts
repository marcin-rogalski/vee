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

	it('blocks path traversal attacks', async () => {
		const tool = new WriteFileAdapter()
		const result = await tool.execute(
			JSON.stringify({
				path: '../../../etc/passwd',
				content: 'malicious data',
			}),
		)
		expect(result.content).toMatch('Error writing file:')
	})

	it('verifies undefined code on success', async () => {
		const tool = new WriteFileAdapter()
		const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vee-code-'))
		const filePath = path.join(tmpDir, 'test.txt')

		const result = await tool.execute(
			JSON.stringify({
				path: filePath,
				content: 'test',
			}),
		)

		expect(result.code).toBeUndefined()
		expect(result.content).toMatch('File written')

		await fs.rm(tmpDir, { recursive: true })
	})

	it('overwrites existing file', async () => {
		const tool = new WriteFileAdapter()
		const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vee-overwrite-'))
		const filePath = path.join(tmpDir, 'file.txt')

		// Write initial content
		await fs.writeFile(filePath, 'original content')

		// Overwrite via adapter
		await tool.execute(
			JSON.stringify({
				path: filePath,
				content: 'new content',
			}),
		)

		// Verify overwrite
		const content = await fs.readFile(filePath, 'utf-8')
		expect(content).toBe('new content')

		await fs.rm(tmpDir, { recursive: true })
	})
})
