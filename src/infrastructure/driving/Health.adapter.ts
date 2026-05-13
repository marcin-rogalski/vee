import ExpressEndpoint from '@utilities/ExpressEndpoint.adapter'
import z from 'zod'

class Health extends ExpressEndpoint.typed('GET', '/health', {
	response: z.object({ status: z.string() }),
}) {
	handle() {
		return { status: 'ok' }
	}
}

export default Health
