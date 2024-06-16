import { type RequestHandler } from "@sveltejs/kit";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const getFeed = async (url: string) => {
	return await fetch(url, {
		headers: {
			accept: "application/rss+xml",
		},
	}).then((response) => response.text());
};

const getLinksForFeed = async (url: string) => {
	const feed = await getFeed(url);
	const matches = feed.matchAll(/<link>([^<]+)<\/link>/g);

	return Array.from(matches)
		.map((match) => match[1])
		.filter((value) => value.startsWith("https://www.hbl.fi/artikel"));
};

export const GET: RequestHandler = async ({ url }) => {
	const [feed, sportLinks, kulturLinks] = await Promise.all([
		getFeed("https://www.hbl.fi/feeds/feed.xml"),
		getLinksForFeed("https://www.hbl.fi/feeds/section/sport/feed.xml"),
		getLinksForFeed("https://www.hbl.fi/feeds/section/kultur/feed.xml"),
	]);

	const ignoredLinks = [...sportLinks, ...kulturLinks];

	const parser = new XMLParser();
	let feedParsed = parser.parse(feed);

	const items = feedParsed.rss.channel.item;

	const filteredItems = items.filter((item: any) => {
		const ok = !ignoredLinks.includes(item.link);

		if (!ok) {
			console.log(`Ignore: ${item.link}`);
		}

		return ok;
	});

	feedParsed.rss.channel.item = filteredItems;

	const builder = new XMLBuilder();
	const xmlContent = builder.build(feedParsed);

	return new Response(xmlContent);
};
