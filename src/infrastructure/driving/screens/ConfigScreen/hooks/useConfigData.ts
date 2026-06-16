import type Agent from '@domain/Agent'
import type Provider from '@domain/Provider'
import { useEffect, useState } from 'react'

type AgentItem = Pick<Agent, 'id' | 'name' | 'description'>
type ProviderItem = Pick<Provider, 'id' | 'name' | 'type'>

type Props = {
	agents: { list: () => Promise<AgentItem[]> }
	providers: { list: () => Promise<ProviderItem[]> }
}

export function useConfigData({ agents, providers }: Props) {
	const [agentList, setAgentList] = useState<AgentItem[] | null>(null)
	const [providerList, setProviderList] = useState<ProviderItem[] | null>(null)

	useEffect(() => {
		Promise.all([agents.list(), providers.list()]).then(([ags, provs]) => {
			setAgentList(ags)
			setProviderList(provs)
		})
	}, [])

	const refreshAgents = async () => {
		const updated = await agents.list()
		setAgentList(updated)
		return updated
	}

	const refreshProviders = async () => {
		const updated = await providers.list()
		setProviderList(updated)
		return updated
	}

	return {
		agentList,
		providerList,
		setAgentList,
		setProviderList,
		refreshAgents,
		refreshProviders,
	}
}
