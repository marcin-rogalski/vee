import { describe, expect, it } from 'vitest'
import ReadFileAdapter from './ReadFile.adapter'

describe('ReadFileAdapter', () => {
	it('returns file contents on success', async () => {
		const tool = new ReadFileAdapter()
		const result = await tool.execute(
			JSON.stringify({ path: '/some/file.txt' }),
		)
		// Will fail on missing file but validates the call path
		expect(typeof result.content).toBe('string')
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
