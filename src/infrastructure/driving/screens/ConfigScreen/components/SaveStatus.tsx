import { Text } from 'ink'

type Props = {
	status: 'idle' | 'saving' | 'saved' | 'removed'
}

export function SaveStatus({ status }: Props) {
	if (status === 'saving') {
		return <Text color="yellow">Saving...</Text>
	}
	if (status === 'saved') {
		return <Text color="green">Saved!</Text>
	}
	if (status === 'removed') {
		return <Text color="green">Removed!</Text>
	}
	return null
}
