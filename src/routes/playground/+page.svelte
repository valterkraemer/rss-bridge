<script lang="ts">
	import {
		getBodyHTML,
		getDocument,
		getSelectors,
		getPosts,
	} from "$lib/htmlParser";

	let url = $state("");
	let itemSelector = $state("");
	let linkSelector = $state("");
	let headingSelector = $state("");
	let descriptionSelector = $state("");
	let dateSelector = $state("");

	let htmlDocument = $state<Document>();

	const loadHTML = async () => {
		const data = await fetch("/playground/proxy", {
			method: "POST",
			body: JSON.stringify({
				url,
			}),
		});

		const html = await data.text();

		htmlDocument = getDocument(html);
		const selectors = getSelectors(htmlDocument);

		console.log("selectors", selectors);

		itemSelector = selectors?.item ?? "";
		linkSelector = selectors?.anchor ?? "";
		headingSelector = selectors?.heading ?? "";
		descriptionSelector = selectors?.description ?? "";
		dateSelector = selectors?.date ?? "";
	};

	let body = $derived.by(() => {
		return getBodyHTML(htmlDocument);
	});

	let posts = $derived.by(() => {
		return getPosts(htmlDocument, {
			anchor: linkSelector,
			date: dateSelector,
			description: descriptionSelector,
			heading: headingSelector,
			item: itemSelector,
		});
	});

	let config = $derived.by(() => {
		return `const config = {
  url: ${JSON.stringify(url)},
  itemSelector: ${JSON.stringify(itemSelector)},
  linkSelector: ${JSON.stringify(linkSelector)},
  headingSelector: ${JSON.stringify(headingSelector)},
  descriptionSelector: ${JSON.stringify(descriptionSelector)},
  dateSelector: ${JSON.stringify(dateSelector)},
}`;
	});
</script>

<h1>Playground</h1>

<p>Create the config a URL</p>

<table>
	<tbody>
		<tr>
			<td>URL</td>
			<td
				><input type="text" bind:value={url} />
				<button onclick={loadHTML}>Guess selectors</button></td
			>
		</tr>
		<tr>
			<td>item</td>
			<td><input type="text" bind:value={itemSelector} /></td>
		</tr>
		<tr>
			<td>anchor</td>
			<td><input type="text" bind:value={linkSelector} /></td>
		</tr>
		<tr>
			<td>heading</td>
			<td><input type="text" bind:value={headingSelector} /></td>
		</tr>
		<tr>
			<td>description</td>
			<td><input type="text" bind:value={descriptionSelector} /></td>
		</tr>
		<tr>
			<td>date</td>
			<td><input type="text" bind:value={dateSelector} /></td>
		</tr>
	</tbody>
</table>

<details open>
	<summary>Config</summary>

	<pre>
{config}
  </pre>
</details>

<details open>
	<summary>Items</summary>
	<ol>
		{#each posts as post}
			<li>
				<h2>{post.heading}</h2>
				<p>{post.date}</p>
				<p>Url: {post.url}</p>
				<p>
					{post.description}
				</p>
			</li>
		{/each}
	</ol>
</details>

<details>
	<summary>HTML</summary>
	<pre>
    {#await body then value}<!-- prettier-ignore -->
{value}
		{/await}
  </pre>
</details>
