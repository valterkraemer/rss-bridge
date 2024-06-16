import { htmlToRss } from "$lib/htmlToRss";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
	return htmlToRss({
		url: "https://rocicorp.dev/blog",
		itemSelector: "ARTICLE",
		linkSelector: "A",
		headingSelector: "H1",
		descriptionSelector: ".mb-3",
		dateSelector: "P.mb-1",
	});
};
