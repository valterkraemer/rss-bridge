import { z } from "zod";
import type { RequestHandler } from "./$types";
import { error, json, text } from "@sveltejs/kit";
import { toRss } from "$lib/toRss";

const key = "twitter.com/i/lists/";

const Params = z.object({
	listId: z.string(),
});

const Author = z.object({
	name: z.string(),
	screenName: z.string(),
});

const Tweet = z.object({
	url: z.string(),
	createdAt: z.coerce.date(),
	author: Author,
	text: z.string().optional(),
	image: z.string().optional(),
});

const TopLevelTweet = Tweet.extend({
	type: z.enum(["plain", "quote", "retweet"]),
	referenced: Tweet.optional(),
});

const Tweets = z.array(TopLevelTweet);

export const GET: RequestHandler = async ({ platform, params, url }) => {
	const { listId } = Params.parse(params);

	const result = await platform?.env.ITEM.get(`${key}${listId}`);

	if (!result) {
		const rss = toRss({
			title: `Twitter list ${listId}`,
			currentUrl: url.href,
			description: `Twitter list for list id ${listId}`,
			targetUrl: `https://twitter.com/i/lists/${listId}`,
			items: [],
		});

		return text(rss);
	}

	return text(result);
};

const createItemText = (item: z.infer<typeof TopLevelTweet>) => {
	const text = item.text ?? "";

	switch (item.type) {
		case "plain":
			return `${text}${
				item.image
					? `

<img src="${item.image}" />`
					: ""
			}`;
		case "quote":
			return `${text}

<hr />
In response to: @${item.referenced!.author.screenName}
${item.referenced!.text}${
				item.referenced!.image
					? `

<img src="${item.referenced!.image}" />`
					: ""
			}
`;
		case "retweet":
			return `@${item.author.screenName} reposted

<hr />
${item.referenced!.text}${
				item.referenced!.image
					? `

<img src="${item.referenced!.image}" />`
					: ""
			}`;
	}
};

export const POST: RequestHandler = async ({
	platform,
	params,
	request,
	url,
}) => {
	const { listId } = Params.parse(params);
	const apiKey = request.headers.get("X-API-key");

	if (apiKey !== "123") {
		return error(403, "Forbidden");
	}

	const data = await request.json();

	const tweets = Tweets.parse(data);

	const rss = toRss({
		title: `Twitter list ${listId}`,
		currentUrl: url.href,
		description: `Twitter list for list id ${listId}`,
		targetUrl: `https://twitter.com/i/lists/${listId}`,
		items: tweets.map((tweet) => ({
			title:
				tweet.type === "retweet"
					? `@${tweet.referenced!.author.screenName}`
					: `@${tweet.author.screenName}`,
			description: createItemText(tweet).replaceAll("\n", "<br />"),
			link: tweet.url,
			pubDate: tweet.createdAt.toUTCString(),
		})),
	});

	await platform?.env.ITEM.put(`${key}${listId}`, rss);

	return json({});
};
