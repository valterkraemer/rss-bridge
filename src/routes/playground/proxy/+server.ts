import type { RequestHandler } from "@sveltejs/kit";
import z from "zod";

const Params = z.object({
	url: z.string(),
});

export const POST: RequestHandler = async ({ request }) => {
	const { url } = Params.parse(await request.json());

	const html = await fetch(url, {
		headers: {
			accept: "text/html",
		},
	}).then((response) => response.text());

	return new Response(html);
};
