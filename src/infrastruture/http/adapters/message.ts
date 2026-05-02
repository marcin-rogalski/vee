import UserMessageUseCase from "@application/usecases/UserMessage";
import z from "zod";
import Endpoint from "../server/endpoint";

const message = new Endpoint(
	"POST",
	"/{session:string}/message",
	{
		params: z.object({ session: z.string() }),
		body: z.object({ message: z.string() }),
	},
	async (req, res) => {
		const useCase = new UserMessageUseCase(
			req.params.session,
			req.body.message,
		);

		for await (const {} of useCase.generateResponse()) {
			// todo: sse events yileded by use case
		}

		res.sendStatus(200);
	},
);

export default message;
