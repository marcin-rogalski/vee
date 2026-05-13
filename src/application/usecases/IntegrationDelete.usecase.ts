import type IntegrationManagerPort from '@application/ports/IntegrationManager.port'

class IntegrationDeleteUseCase {
	constructor(readonly integrationManager: IntegrationManagerPort) {
		//
	}

	async execute(id: string): Promise<void> {
		await this.integrationManager.delete(id)
	}
}

export default IntegrationDeleteUseCase
