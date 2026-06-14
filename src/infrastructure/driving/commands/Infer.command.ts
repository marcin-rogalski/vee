import type LoggerPort from '@application/ports/Logger.port'
import { Command } from 'commander'

export type InferCommandDeps = {
	inferUseCase: {
		execute(prompt: string, agentId: string, sessionId: string): Promise<void>
	}
	logger: LoggerPort
}

export function createInferCommand(deps: InferCommandDeps): Command {
	const command = new Command('infer <prompt>')
		.description('Run inference with an agent')
		.requiredOption('--agent-id <id>', 'Agent ID to use for inference')
		.requiredOption('--session-id <id>', 'Session ID for context')
		.action(async (prompt: string, { agentId, sessionId }) => {
			await deps.inferUseCase.execute(prompt, agentId, sessionId)
		})

	return command
}
