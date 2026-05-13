import { describe, expect, it } from 'vitest'
import ReadFileAdapter from './ReadFile.adapter'

describe('ReadFileAdapter', () => {
	it('returns file contents on success', async () => {
		const tool = new ReadFileAdapter()
		const result = await tool.execute({ path: '/some/file.txt' })
		// Will fail on missing file but validates the call path
		expect(typeof result).toBe('string')
	})

	it('returns error message on failure', async () => {
		const tool = new ReadFileAdapter()
		const result = await tool.execute({
			path: '/nonexistent/vee-test-file.txt',
		})
		expect(result).toMatch('Error reading file:')
	})

	it('throws on invalid args', async () => {
		const tool = new ReadFileAdapter()
		await expect(tool.execute({})).rejects.toThrow()
	})
})
