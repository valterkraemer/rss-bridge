import { z } from "zod";
import type { RequestHandler } from "./$types";
import { json, text } from "@sveltejs/kit";
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
	text: z.string(),
});

const TopLevelTweet = Tweet.extend({
	quoted: Tweet.optional(),
});

const Tweets = z.array(TopLevelTweet);

export const GET: RequestHandler = async ({ platform, params }) => {
	const { listId } = Params.parse(params);

	const result = await platform?.env.ITEM.get(`${key}${listId}`);

	if (!result) {
		return text("");
	}

	return text(result);
};

const createItemText = (item: z.infer<typeof TopLevelTweet>) => {
	if (!item.quoted) {
		return item.text;
	}

	return `${item.text}

---

In response to: @${item.quoted.author.screenName}
${item.quoted.text}
`;
};

export const POST: RequestHandler = async ({
	platform,
	params,
	request,
	url,
}) => {
	const { listId } = Params.parse(params);
	const data = await request.json();

	const tweets = Tweets.parse(data);

	const rss = toRss({
		title: `Twitter list ${listId}`,
		currentUrl: url.href,
		description: `Twitter list for list id ${listId}`,
		targetUrl: `https://twitter.com/i/lists/${listId}`,
		items: tweets.map((tweet) => ({
			title: `@${tweet.author.screenName}`,
			description: createItemText(tweet),
			link: tweet.url,
			pubDate: tweet.createdAt.toUTCString(),
		})),
	});

	await platform?.env.ITEM.put(`${key}${listId}`, rss);

	return json({});
};
