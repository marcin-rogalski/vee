import { z } from 'zod'
import NodeEnvironment from './src/infrastructure/utilities/NodeEnvironment.adapter'

declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof NodeEnvironment.schema> {}
	}
}
