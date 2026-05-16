export type ConfigurationSchemaDto = {
	key: string
	required: boolean
	type: 'string' | 'number' | 'boolean'
	options?: Array<string | number>
	description: string
}

export default ConfigurationSchemaDto
