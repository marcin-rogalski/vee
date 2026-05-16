import type AgentRepositoryPort from '@application/ports/AgentRepository.port'
import type ContextRepositoryPort from '@application/ports/ContextRepository.port'
import type EventBusPort from '@application/ports/EventBus.port'
import { Channel, type Envelope } from '@application/ports/EventBus.port'
import type ProviderPort from '@application/ports/Provider.port'
import type ProviderRegistryPort from '@application/ports/ProviderRegistry.port'
import type ProviderRepositoryPort from '@application/ports/ProviderRepository.port'
import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
import type ToolRegistryPort from '@application/ports/ToolRgistry.port'
import type ConversationEntry from '@domain/ConversationEntry'

type PendingToolCall = {
	index: number
	name: string
	content: string
	code: number | undefined
}

class InferUseCase {
	private readonly channel = Channel.INFERENCE

	constructor(
		readonly sessionRepository: SessionRepositoryPort,
		readonly contextRepository: ContextRepositoryPort,
		readonly providerRepository: ProviderRepositoryPort,
		readonly providerRegistry: ProviderRegistryPort,
		readonly agentRepository: AgentRepositoryPort,
		readonly toolRepository: ToolRegistryPort,
		readonly eventBus: EventBusPort,
	) {}

	async execute(
		prompt: string,
		agentId: string,
		sessionId: string,
	): Promise<void> {
		const agent = await this.agentRepository.get(agentId)
		const providerEntity = await this.providerRepository.get(agent.providerId)
		const provider = this.providerRegistry.resolve(providerEntity)
		const tools = agent.toolIds.map(
			(id) => this.toolRepository.get(id).definition,
		)

		let entry: ConversationEntry = {
			id: crypto.randomUUID(),
			role: 'user',
			content: prompt,
			ts: Date.now(),
		}

		await this.publish({ type: 'prompt', ...entry })
		await this.contextRepository.append(sessionId, entry)

		while (true) {
			const context = await this.getContext(sessionId, provider)
			let pendingTokens: string[] = []
			let pendingToolCalls: Array<Promise<PendingToolCall>> = []

			for await (const event of provider.infer(
				agent.providerConfiguration,
				context,
				tools,
			)) {
				switch (event.type) {
					case 'thought': {
						this.publish({
							id: crypto.randomUUID(),
							role: 'assistant',
							type: 'thought',
							content: event.content,
							ts: Date.now(),
						})
						continue
					}

					case 'token': {
						pendingTokens.push(event.content)
						this.publish({
							id: crypto.randomUUID(),
							role: 'assistant',
							type: 'token',
							content: event.content,
							ts: Date.now(),
						})
						continue
					}

					case 'tool-call': {
						const id = crypto.randomUUID()
						const role = 'assistant'
						const content = pendingTokens.join('')
						const ts = Date.now()

						entry = { id, role, content, toolCalls: event.toolCalls, ts }
						pendingTokens = []

						await this.publish({
							id,
							role,
							type: 'tool-call',
							toolCalls: event.toolCalls,
							ts,
						})
						await this.contextRepository.append(sessionId, entry)

						pendingToolCalls.push(
							...event.toolCalls.map(
								async ({ name, arguments: args }, index) => {
									const tool = this.toolRepository.get(name)
									const result = await tool.execute(args)

									return { index, name, ...result }
								},
							),
						)
					}
				}
			}

			if (pendingToolCalls.length) {
				while (pendingToolCalls.length) {
					const { index, name, content, code } =
						await Promise.race(pendingToolCalls)

					pendingToolCalls.splice(index, 1)

					const id = crypto.randomUUID()
					const role = 'system'
					const type = 'tool-response'
					const ts = Date.now()

					entry = { id, role, name, content, ts }

					await this.publish({ id, role, type, name, content, code, ts })
					await this.contextRepository.append(sessionId, entry)
				}

				pendingToolCalls = []

				continue
			}

			break
		}
	}

	private async getContext(
		sessionId: string,
		provider: ProviderPort,
	): Promise<Array<ConversationEntry>> {
		const context = await this.contextRepository.get(sessionId)

		if (provider.shouldCompact(context)) {
			const compacted = await provider.compact(context)
			await this.contextRepository.update(sessionId, compacted)

			return compacted
		}

		return context
	}

	private async publish(event: Envelope): Promise<void> {
		await this.eventBus.publish(this.channel, event)
	}
}

export default InferUseCase
