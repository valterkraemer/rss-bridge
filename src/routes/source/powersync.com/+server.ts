import { htmlToRss } from "$lib/htmlToRss";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
	return htmlToRss({
		url: "https://www.powersync.com/blog",
		itemSelector: ".collection-item",
		linkSelector: "A",
		headingSelector: "H5",
		descriptionSelector: "",
		dateSelector: ".blog-card-created",
	});
};
