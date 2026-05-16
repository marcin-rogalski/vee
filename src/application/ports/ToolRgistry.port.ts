import type ToolPort from './Tool.port'

interface ToolRegistryPort {
	get(id: string): ToolPort
	list(): Array<Pick<ToolPort, 'id' | 'description'>>
}

export default ToolRegistryPort
