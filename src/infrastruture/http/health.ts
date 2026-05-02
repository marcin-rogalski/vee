import z from "zod";
import Endpoint from "./server/endpoint";

const health = new Endpoint(
	"GET",
	"/health",
	{ response: z.object({ status: z.string() }) },
	(_req, res) => {
		res.json({ status: "ok" });
	},
);

export default health;
