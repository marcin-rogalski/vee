import z from "zod";
import Endpoint from "../server/endpoint";

export default Endpoint.create(
	"GET",
	"/health",
	{ response: z.object({ status: z.string() }) },
	() => ({ status: "ok" }),
);
