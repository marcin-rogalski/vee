import type EventBusPort from '@application/ports/EventBus.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import { ValidationError } from '@domain/errors'
import type Provider from '@domain/Provider'
import { validateJsonSchema } from '@infrastructure/driven/providers/jsonSchemaToZod'

class ProviderUpsertUseCase {
	constructor(
		readonly providerRepository: ProviderRepositoryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(provider: Provider): Promise<void> {
		if (provider.configSchema) {
			try {
				validateJsonSchema(provider.config, provider.configSchema)
			} catch (error) {
				if (error instanceof ValidationError) {
					throw new ValidationError({
						...(error.metadata.details as Record<string, string>),
						_config: `Provider config for "${provider.name}" is invalid`,
					})
				}
				throw error
			}
		}
		await this.providerRepository.save(provider)
		this.eventBus.publish({
			id: crypto.randomUUID(),
			ts: Date.now(),
			role: 'system',
			type: 'provider-saved',
			providerId: provider.id,
			name: provider.name,
		})
	}
}

export default ProviderUpsertUseCase
