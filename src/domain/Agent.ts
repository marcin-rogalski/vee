export type Agent = {
	id: string
	name: string
	description?: string | undefined
	systemPrompt: string
	providerId: string
	/** Per-agent configuration overrides.
	 *
	 * Merged with the provider's shared config at inference time:
	 *   finalConfig = { ...provider.config, ...agent.providerOverrides }
	 * This allows agents to override specific fields (model, temperature)
	 * while inheriting shared values (apiKey, baseUrl) from the provider.
	 */
	providerOverrides: Record<string, unknown>
	toolIds: string[]
}

export default Agent
