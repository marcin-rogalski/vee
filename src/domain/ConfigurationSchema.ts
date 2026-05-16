export type ConfigurationSchema = {
	key: string
	required: boolean
	type: 'string' | 'number' | 'boolean'
	options: Array<string | number> | undefined
	description: string
}

export default ConfigurationSchema
