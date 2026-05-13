import type IntegrationManagerPort from '@application/ports/IntegrationManager.port'

class IntegrationListUseCase {
	constructor(readonly integrationManager: IntegrationManagerPort) {
		//
	}

	async execute(): Promise<Array<string>> {
		return await this.integrationManager.list()
	}
}

export default IntegrationListUseCase
