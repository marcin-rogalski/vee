import type EventBusPort from '@application/ports/EventBus.port'
import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type InferCommandDeps = {
	inferUseCase: {
		execute(prompt: string, agentId: string, sessionId: string): Promise<void>
	}
	eventBus: EventBusPort
	logger: LoggerPort
}

export function createInferCommand(deps: InferCommandDeps): Command {
	const command = new Command('infer')
		.description('Run inference with an agent')
		.argument('<prompt>', 'Prompt to send to the agent')
		.requiredOption('--agent-id <id>', 'Agent ID to use for inference')
		.requiredOption('--session-id <id>', 'Session ID for context')
		.option('--stream', 'Stream tokens to stdout as they arrive', true)
		.action(async (prompt: string, { agentId, sessionId, stream }) => {
			try {
				deps.logger.info('Starting inference', { agentId, sessionId })

				// Subscribe to events before starting inference
				const events = deps.eventBus.subscribe()

				// Start event consumer
				const consumerPromise = (async () => {
					for await (const envelope of events) {
						if (envelope.type === 'token') {
							if (stream) {
								process.stdout.write(envelope.content ?? '')
							}
						} else if (envelope.type === 'done') {
							if (stream) {
								process.stdout.write('\n')
							}
							break
						} else if (envelope.type === 'error') {
							deps.logger.error('Inference error', {
								message: envelope.message,
							})
							break
						}
					}
				})()

				// Execute inference (fires events)
				await Promise.all([
					deps.inferUseCase.execute(prompt, agentId, sessionId),
					consumerPromise,
				])

				events.unsubscribe()
				deps.logger.info('Inference complete')
			} catch (error) {
				deps.logger.error('Inference failed', {
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
				})
				process.exit(1)
			}
		})

	return command
}
