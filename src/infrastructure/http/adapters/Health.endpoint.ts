import z from "zod";
import Endpoint from "../server/endpoint";

class HealthEndpoint extends Endpoint.typed("GET", "/health", {
	response: z.object({ status: z.string() }),
}) {
	handle() {
		return { status: "ok" };
	}
}

export default HealthEndpoint;
