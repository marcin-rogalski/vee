import type ConversationEntry from '@domain/ConversationEntry'
import type AgentRepositoryPort from '../ports/AgentRepository.port'
import type ChatMessageService from '../ports/ChatMessageService.port'
import type ContextService from '../ports/ContextService.port'
import type EventBusPort from '../ports/EventBus.port'
import type ProviderPort from '../ports/Provider.port'
import type ProviderRegistryPort from '../ports/ProviderRegistry.port'
import type ProviderRepositoryPort from '../ports/ProviderRepository.port'
import type ToolPort from '../ports/Tool.port'
import type ToolRegistryPort from '../ports/ToolRegistry.port'
import type BuildContextUseCase from './BuildContext.usecase'
import type ExecuteToolsUseCase from './ExecuteTools.usecase'
import type InferTurnUseCase from './InferTurn.usecase'

/** Orchestrator that owns the inference loop.
 *
 * Flow:
 * 1. Resolve agent, provider, tools (once)
 * 2. Persist user prompt (context + chat message + event)
 * 3. Loop:
 *    a. Build context (system prompt + history)
 *    b. Infer (single turn — stream tokens, detect tool calls)
 *    c. Persist assistant response (context + chat message + event)
 *    d. If tool calls: execute tools, persist results, repeat
 *    e. If no tool calls: publish done event, break
 */
class InferOrchestratorUseCase {
	constructor(
		readonly agentRepository: AgentRepositoryPort,
		readonly providerRepository: ProviderRepositoryPort,
		readonly providerRegistry: ProviderRegistryPort,
		readonly toolRegistry: ToolRegistryPort,
		readonly contextService: ContextService,
		readonly chatMessageService: ChatMessageService,
		readonly eventBus: EventBusPort,
		readonly buildContextUseCase: BuildContextUseCase,
		readonly executeToolsUseCase: ExecuteToolsUseCase,
		readonly createInferTurnUseCase: (
			provider: ProviderPort,
		) => InferTurnUseCase,
	) {}

	async execute(
		prompt: string,
		agentId: string,
		sessionId: string,
	): Promise<void> {
		// --- Resolve phase (once) ---
		const agent = await this.agentRepository.get(agentId)
		const providerEntity = await this.providerRepository.get(agent.providerId)
		const provider = this.providerRegistry.resolve(providerEntity)
		const tools: Array<ToolPort['definition']> = []
		const toolMap = new Map<string, ToolPort>()
		for (const id of agent.toolIds) {
			const tool = this.toolRegistry.get(id)
			toolMap.set(id, tool)
			tools.push(tool.definition)
		}

		const mergedConfig = {
			...providerEntity.config,
			...agent.providerOverrides,
		}

		// Create infer turn use case with resolved provider (provider is runtime-dependent)
		const inferTurnUseCase = this.createInferTurnUseCase(provider)

		// --- Persist user prompt ---
		const userEntry: ConversationEntry = {
			id: crypto.randomUUID(),
			role: 'user',
			content: prompt,
			ts: Date.now(),
		}

		this.eventBus.publish({ ...userEntry, type: 'prompt' })
		await this.contextService.append(sessionId, userEntry)
		await this.chatMessageService.create({
			id: userEntry.id,
			sessionId,
			role: 'user',
			content: prompt,
			ts: userEntry.ts,
		})

		// --- Inference loop ---
		// NOTE: Context is rebuilt from scratch each iteration to incorporate
		// tool results. This is acceptable at current scale. If performance
		// becomes a concern, consider incremental context updates instead.
		let maxIterations = 10
		while (maxIterations-- > 0) {
			// Build context from scratch each iteration
			const context = await this.buildContextUseCase.execute(agent, sessionId)

			// Single-turn inference
			const result = await inferTurnUseCase.execute(
				context,
				mergedConfig,
				tools,
			)

			// --- Persist assistant response ---
			const assistantEntry: ConversationEntry = {
				id: crypto.randomUUID(),
				role: 'assistant',
				content: result.tokens,
				ts: Date.now(),
				...(result.toolCalls && { toolCalls: result.toolCalls }),
			}

			await this.contextService.append(sessionId, assistantEntry)
			await this.chatMessageService.create({
				id: assistantEntry.id,
				sessionId,
				role: 'assistant',
				content: result.tokens,
				ts: assistantEntry.ts,
			})

			// Publish token/tool-call events
			for (const thought of result.thoughts) {
				this.eventBus.publish({
					id: crypto.randomUUID(),
					role: 'assistant',
					type: 'thought',
					content: thought,
					ts: Date.now(),
				})
			}

			if (result.toolCalls) {
				this.eventBus.publish({
					id: assistantEntry.id,
					role: 'assistant',
					type: 'tool-call',
					toolCalls: result.toolCalls,
					ts: assistantEntry.ts,
				})

				// Execute tools and persist results
				const toolResults = await this.executeToolsUseCase.execute(
					result.toolCalls,
					toolMap,
				)
				for (const toolEntry of toolResults) {
					await this.contextService.append(sessionId, toolEntry)
					const systemEntry = toolEntry as {
						id: string
						role: 'system'
						name: string
						content: string
						ts: number
					}
					this.eventBus.publish({
						id: systemEntry.id,
						role: 'system',
						type: 'tool-response',
						name: systemEntry.name,
						content: systemEntry.content,
						code: undefined,
						ts: systemEntry.ts,
					})
				}

				continue // Re-enter loop with tool results in context
			}

			// No tool calls — final response
			this.eventBus.publish({
				id: crypto.randomUUID(),
				role: 'system',
				type: 'done',
				ts: Date.now(),
			})

			break
		}
	}
}

export default InferOrchestratorUseCase
