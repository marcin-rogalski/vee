import type IntegrationDto from '@application/dto/Integration.dto'
import type IntegrationRepositoryPort from '@application/ports/IntegrationRepository.port'

class InMemoryIntegrationRepository implements IntegrationRepositoryPort {
	private integrations: Map<string, IntegrationDto> = new Map()

	async findById(id: string): Promise<IntegrationDto | null> {
		return this.integrations.get(id) ?? null
	}

	async findAll(): Promise<Array<IntegrationDto>> {
		return Array.from(this.integrations.values())
	}

	async save(record: IntegrationDto): Promise<void> {
		this.integrations.set(record.id, record)
	}

	async delete(id: string): Promise<void> {
		this.integrations.delete(id)
	}
}

export default InMemoryIntegrationRepository
