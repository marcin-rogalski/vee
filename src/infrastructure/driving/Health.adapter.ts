import ExpressEndpoint from '@utilities/ExpressEndpoint.adapter'
import z from 'zod'

const Health = () =>
	ExpressEndpoint.createEndpoint(
		'GET',
		'/health',
		{ response: z.object({ status: z.string() }) },
		async () => {
			return { status: 'ok' }
		},
	)

export default Health
