import type IntegrationDto from '@application/dto/Integration.dto'

interface IntegrationRepositoryPort {
	findById(id: string): Promise<IntegrationDto | null>
	findAll(): Promise<Array<IntegrationDto>>
	save(record: IntegrationDto): Promise<void>
	delete(id: string): Promise<void>
}

export default IntegrationRepositoryPort
