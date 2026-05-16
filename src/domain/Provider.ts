import type ConfigurationSchema from './ConfigurationSchema'

export type Provider = {
	id: string
	name: string
	type: string
	configSchema: Array<ConfigurationSchema>
}

export default Provider
