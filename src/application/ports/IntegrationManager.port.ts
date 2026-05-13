import type IntegrationDto from '@application/dto/Integration.dto'
import type IntegrationRuntimePort from '@application/ports/IntegrationRuntime.port'

interface IntegrationManagerPort {
	list(): Promise<Array<string>>
	get(id: string): Promise<IntegrationRuntimePort>
	upsert(dto: IntegrationDto): Promise<void>
	delete(id: string): Promise<void>
}

export default IntegrationManagerPort
