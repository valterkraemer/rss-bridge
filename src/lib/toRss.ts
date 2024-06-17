function escape(unsafe: string) {
	return unsafe
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

export type RssItem = {
	title: string;
	description: string;
	link: string;
	pubDate: string;
};

export type RssParams = {
	title: string;
	description?: string;
	currentUrl: string;
	targetUrl: string;
	items: RssItem[];
};

export const toRss = ({
	title,
	description,
	currentUrl,
	targetUrl,
	items,
}: RssParams) => {
	const lastBuildDate =
		items.map((item) => item.pubDate)[0] ?? new Date().toUTCString();

	return `
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
			currentUrl,
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
};
