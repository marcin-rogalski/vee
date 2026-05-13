import { randomUUID } from 'node:crypto'
import type AgentDto from '@application/dto/Agent.dto'
import type ContextDto from '@application/dto/Context.dto'
import type ContextEntryDto from '@application/dto/ContextEntry.dto'
import type InferenceEnvelopeDto from '@application/dto/InferenceEnvelope.dto'
import type { InferenceEventDto } from '@application/dto/InferenceEnvelope.dto'
import type ToolDefinitionDto from '@application/dto/ToolDefinition.dto'
import type AgentManagerPort from '@application/ports/AgentManager.port'
import type ContextManagerPort from '@application/ports/ContextManager.port'
import type IntegrationManagerPort from '@application/ports/IntegrationManager.port'
import type IntegrationRuntimePort from '@application/ports/IntegrationRuntime.port'
import type LoggerPort from '@application/ports/Logger.port'
import type SessionManagerPort from '@application/ports/SessionManager.port'
import type ToolManagerPort from '@application/ports/ToolManager.port'

class InferUseCase {
	constructor(
		readonly logger: LoggerPort,
		readonly sessionManager: SessionManagerPort,
		readonly contextManager: ContextManagerPort,
		readonly agentManager: AgentManagerPort,
		readonly integrationManager: IntegrationManagerPort,
		readonly toolManager: ToolManagerPort,
	) {}

	async *execute(
		prompt: string,
		agentId: string,
		sessionId: string,
	): AsyncGenerator<InferenceEnvelopeDto> {
		const session = await this.sessionManager.get(sessionId)
		const agent = await this.agentManager.get(agentId)
		const context = await this.contextManager.getContext(session, agent)
		const tools = await this.toolManager.getTools()
		const integration = await this.integrationManager.get(agent.integrationId)

		context.startTurn(prompt)

		yield this.toEnvelope(sessionId, {
			type: 'prompt',
			data: { content: prompt },
		})

		for await (const event of this.infer(agent, integration, context, tools)) {
			const entry = this.buildContextEntry(event)
			if (entry) {
				context.push(entry)
				this.sessionManager.append(session.id, entry)
			}
			yield this.toEnvelope(sessionId, event)
		}

		context.commitTurn()
	}

	private buildContextEntry(event: InferenceEventDto): ContextEntryDto | null {
		const ts = Date.now()

		switch (event.type) {
			case 'token':
				return { author: 'assistant', data: event.data.content, ts }
			case 'tool-call':
				return {
					author: 'tool-call',
					id: event.data.correlationId,
					name: event.data.name,
					arguments: event.data.arguments,
					ts,
				}
			case 'tool-response':
				return {
					author: 'tool-result',
					id: event.data.correlationId,
					result: event.data.result,
					ts,
				}
			default:
				return null
		}
	}

	private toEnvelope(
		sessionId: string,
		event: InferenceEventDto,
	): InferenceEnvelopeDto {
		return {
			id: randomUUID(),
			sessionId,
			timestamp: Date.now(),
			...event,
		}
	}

	private async *infer(
		{ model }: AgentDto,
		{ infer }: IntegrationRuntimePort,
		{ entries }: ContextDto,
		tools: ToolDefinitionDto[],
	): AsyncGenerator<InferenceEventDto> {
		while (true) {
			const pendingToolCalls: Array<
				Promise<{ correlationId: string; result: string; code?: number }>
			> = []

			for await (const event of infer(model, entries, tools)) {
				switch (event.type) {
					case 'tool-call': {
						const correlationId = randomUUID()

						yield { type: 'tool-call', data: { ...event.data, correlationId } }

						pendingToolCalls.push(
							this.toolManager
								.executeTool(event.data.name, event.data.arguments)
								.then((result) => ({ correlationId, ...result })),
						)

						break
					}
					default:
						yield event
				}
			}

			if (!pendingToolCalls.length) {
				break
			}

			while (pendingToolCalls.length) {
				const { index, result } = await Promise.race(
					pendingToolCalls.map(async (toolCall, index) => {
						const result = await toolCall

						return { index, result }
					}),
				)

				pendingToolCalls.splice(index, 1)

				yield {
					type: 'tool-response',
					data: {
						correlationId: result.correlationId,
						result: result.result,
						code: result.code ?? 0,
					},
				}
			}
		}
	}
}

export default InferUseCase
