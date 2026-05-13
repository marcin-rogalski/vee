import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type ToolDefinitionDto from '@application/dto/ToolDefinition.dto'
import type ToolPort from '@application/ports/Tool.port'
import { z } from 'zod'

const argsSchema = z.object({
	path: z.string(),
	content: z.string(),
})

class WriteFileAdapter implements ToolPort {
	readonly definition: ToolDefinitionDto = {
		name: 'write_file',
		description:
			'Write content to a file at the given path. Creates the file and any missing parent directories. Returns a confirmation message.',
		parameters: {
			type: 'object',
			properties: {
				path: { type: 'string', description: 'Path to the file to write' },
				content: {
					type: 'string',
					description: 'Content to write to the file',
				},
			},
			required: ['path', 'content'],
		},
	}

	async execute(raw: Record<string, unknown>): Promise<string> {
		const { path: filePath, content } = argsSchema.parse(raw)
		try {
			await fs.mkdir(path.dirname(filePath), { recursive: true })
			await fs.writeFile(filePath, content, 'utf-8')
			return `File written successfully: ${filePath}`
		} catch (err) {
			return `Error writing file: ${err instanceof Error ? err.message : String(err)}`
		}
	}
}

export default WriteFileAdapter
