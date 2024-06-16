export type HtmlToRssConfig = {
	url: string;
	itemSelector: string;
	linkSelector: string;
	headingSelector: string;
	descriptionSelector: string;
	dateSelector: string;
};

type Item = {
	title: string;
	description: string;
	link: string;
	pubDate: string;
};

export const htmlToRss = async (config: HtmlToRssConfig) => {
	const items: Item[] = [];
	let item: Item = {
		title: "",
		description: "",
		link: "",
		pubDate: "",
	};
	let title = "";
	let description = "";

	const targetUrl = new URL(config.url);

	const res = await fetch(targetUrl);

	const htmlRewriter = new HTMLRewriter()
		.on("head title", {
			text(text) {
				title += text.text;
			},
		})
		.on('head meta[name="description"]', {
			text(text) {
				description += text.text;
			},
		})
		.on(config.itemSelector, {
			element() {
				item = {
					title: "",
					description: "",
					link: "",
					pubDate: "",
				};
				items.push(item);
			},
		})
		.on(`${config.itemSelector} ${config.headingSelector}`, {
			text(text) {
				item.title += text.text;
			},
		})
		.on(`${config.itemSelector} ${config.linkSelector}`, {
			element(element) {
				item.link = element.getAttribute("href") ?? "";

				// Make links absolute
				if (item.link.startsWith("/")) {
					item.link = `${targetUrl.origin}${item.link}`;
				}
			},
		});

	if (config.descriptionSelector) {
		htmlRewriter.on(`${config.itemSelector} ${config.descriptionSelector}`, {
			text(text) {
				item.description += text.text;
			},
		});
	}

	if (config.dateSelector) {
		htmlRewriter.on(`${config.itemSelector} ${config.dateSelector}`, {
			text(text) {
				item.pubDate += text.text;

				if (text.lastInTextNode && item.pubDate) {
					item.pubDate = new Date(item.pubDate).toUTCString();
				}
			},
		});
	}

	await htmlRewriter.transform(res).arrayBuffer();

	const lastBuildDate =
		items.map((item) => item.pubDate)[0] ?? new Date().toUTCString();

	const rss = `
<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  version="2.0">

  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${targetUrl}</link>
    <atom:link href="${escape(
			config.url,
		)}" rel="alternate" type="application/rss+xml" />
    <generator>vkrae-rss-generator</generator>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    ${items
			.map(
				(item) => `
    <item>
      <title><![CDATA[${item.title.trim()}]]></title>
      <description><![CDATA[${item.description.trim()}]]></description>
      <link>${item.link.trim()}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <pubDate>${item.pubDate}</pubDate>
    </item>`,
			)
			.join("\n")}
  </channel>
</rss>
  `.trim();

	return new Response(rss, {
		headers: new Headers({
			"Content-Type": "text/xml",
			charset: "utf-8",
		}),
	});
};
