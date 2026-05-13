/**
 * Persistence layer — plain data for DB storage.
 * Used by repository ports and IntegrationManager.upsert().
 */
interface IntegrationDto<IntegrationConfiguration extends object = object> {
	id: string
	type: string
	configuration: IntegrationConfiguration
}

export default IntegrationDto
