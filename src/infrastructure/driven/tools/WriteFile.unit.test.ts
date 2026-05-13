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

		const result = await tool.execute({
			path: filePath,
			content: 'test data',
		})

		expect(result).toMatch('File written successfully')
		expect(await fs.readFile(filePath, 'utf-8')).toBe('test data')
		await fs.rm(tmpDir, { recursive: true })
	})

	it('returns error message on failure', async () => {
		const tool = new WriteFileAdapter()
		const result = await tool.execute({
			path: '/root/unauthorized/file.txt',
			content: 'data',
		})
		expect(result).toMatch('Error writing file:')
	})

	it('throws on invalid args', async () => {
		const tool = new WriteFileAdapter()
		await expect(tool.execute({ path: '/x' })).rejects.toThrow()
	})
})
