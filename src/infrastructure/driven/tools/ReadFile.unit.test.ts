import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import ReadFileAdapter from './ReadFile.adapter'

describe('ReadFileAdapter', () => {
	it('returns file contents on success', async () => {
		const tool = new ReadFileAdapter()
		const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vee-readfile-'))
		const testFile = path.join(tmpDir, 'test.txt')
		const testContent = 'Hello, World!'

		// Create test file
		await fs.writeFile(testFile, testContent)

		// Read it back
		const result = await tool.execute(JSON.stringify({ path: testFile }))

		expect(result.content).toBe(testContent)
		expect(result.code).toBeUndefined()

		// Cleanup
		await fs.rm(tmpDir, { recursive: true })
	})

	it('expands tilde paths correctly', async () => {
		const tool = new ReadFileAdapter()
		const testDir = path.join(os.homedir(), 'vee-tilde-test')
		const testFile = path.join(testDir, 'test.txt')
		const testContent = 'Tilde test content'

		// Create temp dir and test file in home directory
		await fs.mkdir(testDir, { recursive: true })
		await fs.writeFile(testFile, testContent)

		// Use tilde path
		const result = await tool.execute(JSON.stringify({ path: '~/vee-tilde-test/test.txt' }))

		expect(result.content).toBe(testContent)

		// Cleanup
		await fs.rm(testDir, { recursive: true })
	})

	it('returns error message on failure', async () => {
		const tool = new ReadFileAdapter()
		const result = await tool.execute(
			JSON.stringify({ path: '/nonexistent/vee-test-file.txt' }),
		)
		expect(result.content).toMatch('Error reading file:')
	})

	it('returns error code on invalid args', async () => {
		const tool = new ReadFileAdapter()
		const result = await tool.execute(JSON.stringify({}))
		expect(result.code).toBe(400)
	})

	it('returns error code on invalid JSON', async () => {
		const tool = new ReadFileAdapter()
		const result = await tool.execute('not-json')
		expect(result.code).toBe(400)
	})
})
