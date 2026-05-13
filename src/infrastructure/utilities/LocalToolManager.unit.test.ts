import type ToolPort from '@application/ports/Tool.port'
import { describe, expect, it, vi } from 'vitest'
import LocalToolManagerAdapter from './LocalToolManager.adapter'

function fakeTool(name: string, result = 'ok'): ToolPort {
	return {
		definition: { name, description: '', parameters: {} },
		execute: vi.fn().mockResolvedValue(result),
	}
}

describe('LocalToolManagerAdapter', () => {
	it('getTools returns definitions of registered tools', async () => {
		const mgr = new LocalToolManagerAdapter()
		mgr.register(fakeTool('a'), fakeTool('b'))
		const tools = await mgr.getTools()
		expect(tools.map((t) => t.name)).toEqual(['a', 'b'])
	})

	it('executeTool delegates to the matching tool', async () => {
		const mgr = new LocalToolManagerAdapter()
		const tool = fakeTool('my_tool', 'result')
		mgr.register(tool)
		const { result } = await mgr.executeTool('my_tool', { x: 1 })
		expect(result).toBe('result')
		expect(tool.execute).toHaveBeenCalledWith({ x: 1 })
	})

	it('returns code 404 when tool not found', async () => {
		const mgr = new LocalToolManagerAdapter()
		const { result, code } = await mgr.executeTool('missing', {})
		expect(result).toBe('Tool not found: missing')
		expect(code).toBe(404)
	})
})
