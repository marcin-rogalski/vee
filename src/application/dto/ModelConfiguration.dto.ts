/**
 * Base interface for model configurations.
 * Infrastructure layer types (e.g., OpenAiModelConfig) extend this interface.
 */
interface ModelConfigurationDto {
	tokenLimit: number
	systemPrompt?: string
}

export default ModelConfigurationDto
