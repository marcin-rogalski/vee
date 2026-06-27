import type { ProviderEvent } from '@application/ports/Provider.port'
import type { ToolDefinition } from '@application/ports/Tool.port'
import type { ConversationEntry } from '@domain/ConversationEntry'
import type { JsonSchemaObject } from '@domain/JsonSchema'
import OpenAI from 'openai'
import ProviderBase from './ProviderBase'

/** OpenAI-compatible provider implementation.
 *
 * Works with:
 * - OpenAI API (default baseUrl)
 * - LM Studio (http://localhost:1234)
 * - Any OpenAI-compatible endpoint (Ollama, vLLM, etc.)
 *
 * Configuration schema defines the fields the CLI/Web form will render:
 * - model (required string) — model name
 * - apiKey (optional string) — API key (not needed for local LM Studio)
 * - baseUrl (optional string) — API endpoint URL
 * - temperature (optional number) — sampling temperature (0-2)
 */
class OpenAIProvider extends ProviderBase {
	readonly id: string
	override type = 'openai'

	static override CONFIG_SCHEMA = {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		type: 'object' as const,
		description: 'OpenAI-compatible API configuration',
		properties: {
			model: {
				type: 'string',
				description: 'Model to use for inference',
			},
			apiKey: {
				type: 'string',
				description: 'API key (not needed for local LM Studio)',
			},
			baseUrl: {
				type: 'string',
				description:
					'API endpoint URL (e.g. http://localhost:1234 for LM Studio)',
			},
			temperature: {
				type: 'number',
				description: 'Sampling temperature (0-2)',
			},
		},
		required: ['model'],
	} as unknown as JsonSchemaObject

	constructor(id: string) {
		super()
		this.id = id
	}

	async *infer(
		configuration: Record<string, unknown>,
		context: readonly ConversationEntry[],
		tools: readonly ToolDefinition[],
	): AsyncGenerator<ProviderEvent> {
		const model = configuration.model as string | undefined
		if (!model) {
			throw new Error('Model is required for inference')
		}

		const apiKey = (configuration.apiKey as string) ?? 'not-needed'
		const baseUrl = configuration.baseUrl as string | undefined
		const temperature = configuration.temperature as number | undefined

		// Ensure baseURL ends with /v1 for LM Studio and other OpenAI-compatible servers
		const normalizedBaseUrl = baseUrl
			? baseUrl.replace(/\/?$/, '/v1')
			: undefined

		const client = new OpenAI({
			apiKey,
			...(normalizedBaseUrl && { baseURL: normalizedBaseUrl }),
		})

		const messages = this.buildMessages(context)
		const formattedTools =
			tools.length > 0 ? this.formatTools(tools) : undefined

		const stream = await client.chat.completions.create({
			model,
			messages,
			stream: true,
			...(temperature !== undefined && { temperature }),
			...(formattedTools && { tools: formattedTools }),
		})

		let _fullContent = ''
		const toolCalls: Array<{ name: string; arguments: string }> = []

		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (!delta) {
				continue
			}

			if (delta.content) {
				_fullContent += delta.content
				yield { type: 'token', content: delta.content }
			}

			// Handle reasoning/thinking content (e.g. Qwen models)
			// @ts-expect-error - reasoning_content is not in OpenAI SDK types yet
			if (delta.reasoning_content) {
				// @ts-expect-error - reasoning_content is not in OpenAI SDK types yet
				_fullContent += delta.reasoning_content
				// @ts-expect-error - reasoning_content is not in OpenAI SDK types yet
				yield { type: 'thought', content: delta.reasoning_content }
			}

			if (delta.tool_calls) {
				for (const tc of delta.tool_calls) {
					const idx = tc.index
					if (tc.function?.name) {
						if (!toolCalls[idx]) {
							toolCalls[idx] = { name: '', arguments: '' }
						}
						toolCalls[idx].name += tc.function.name
					}
					if (tc.function?.arguments) {
						if (!toolCalls[idx]) {
							toolCalls[idx] = { name: '', arguments: '' }
						}
						toolCalls[idx].arguments += tc.function.arguments
					}
				}
			}
		}

		if (toolCalls.length > 0) {
			yield { type: 'tool-call', toolCalls }
		}
	}

	buildMessages(
		context: readonly ConversationEntry[],
	): OpenAI.ChatCompletionMessageParam[] {
		const messages: OpenAI.ChatCompletionMessageParam[] = []
		for (const entry of context) {
			switch (entry.role) {
				case 'system':
					if ('name' in entry && entry.name) {
						// Tool result entries
						messages.push({
							role: 'tool',
							content: entry.content,
							tool_call_id: entry.id,
						} as OpenAI.ChatCompletionMessageParam)
					} else {
						messages.push({
							role: 'system',
							content: entry.content,
						})
					}
					break
				case 'user':
					messages.push({
						role: 'user',
						content: entry.content,
					})
					break
				case 'assistant': {
					const assistantMsg: OpenAI.ChatCompletionAssistantMessageParam = {
						role: 'assistant',
						content: entry.content || null,
					}
					if (entry.toolCalls && entry.toolCalls.length > 0) {
						assistantMsg.tool_calls = entry.toolCalls.map((tc) => ({
							id: crypto.randomUUID(),
							type: 'function' as const,
							function: {
								name: tc.name,
								arguments: tc.arguments,
							},
						}))
					}
					messages.push(assistantMsg)
					break
				}
			}
		}
		return messages
	}

	formatTools(tools: readonly ToolDefinition[]): OpenAI.ChatCompletionTool[] {
		return tools.map((tool) => {
			let parameters: Record<string, unknown> = {}
			try {
				parameters = JSON.parse(tool.parameters)
			} catch {
				// Invalid JSON — use empty schema
				parameters = {}
			}
			return {
				type: 'function' as const,
				function: {
					name: tool.name,
					description: tool.description,
					parameters: parameters as OpenAI.FunctionParameters,
				},
			}
		})
	}
}

export default OpenAIProvider
