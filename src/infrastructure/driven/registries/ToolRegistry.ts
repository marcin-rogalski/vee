import type ToolPort from '@application/ports/Tool.port'
import type ToolRegistryPort from '@application/ports/ToolRgistry.port'
import { NotFoundError } from '@domain/errors'

class ToolRegistry implements ToolRegistryPort {
	private tools: Map<string, ToolPort> = new Map()

	register(tool: ToolPort): void {
		this.tools.set(tool.id, tool)
	}

	get(id: string): ToolPort {
		const tool = this.tools.get(id)

		if (!tool) {
			throw new NotFoundError('Tool', id)
		}

		return tool
	}

	list(): Array<Pick<ToolPort, 'id' | 'description'>> {
		return Array.from(this.tools.values()).map((tool) => ({
			id: tool.id,
			description: tool.description,
		}))
	}
}

export default ToolRegistry
