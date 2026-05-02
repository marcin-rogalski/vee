import Zod from "zod";

export const HTTP_METHOD_SCHEMA = Zod.enum([
	"GET",
	"POST",
	"PUT",
	"DELETE",
	"PATCH",
]);
