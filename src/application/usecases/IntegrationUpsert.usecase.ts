import type IntegrationDto from '@application/dto/Integration.dto'
import type IntegrationManagerPort from '@application/ports/IntegrationManager.port'

class IntegrationUpsertUseCase {
	constructor(readonly integrationManager: IntegrationManagerPort) {
		//
	}

	async execute(integration: IntegrationDto): Promise<void> {
		await this.integrationManager.upsert(integration)
	}
}

export default IntegrationUpsertUseCase
