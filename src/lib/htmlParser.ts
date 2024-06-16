import { format } from "prettier";
import prettierPluginHTML from "prettier/plugins/html";

export type Selectors = {
	item: string;
	anchor: string | undefined;
	heading: string | undefined;
	description: string | undefined;
	date: string | undefined;
};

export type Post = {
	heading: string | undefined;
	url: string | undefined;
	date: string | undefined;
	description: string | undefined;
};

export const getDocument = (html: string) => {
	const domParser = new DOMParser();

	return domParser.parseFromString(html, "text/html");
};

export const getBodyHTML = async (doc: Document | undefined) => {
	if (!doc) {
		return;
	}

	let main = doc.querySelector("main");

	if (!main) {
		main = doc.body;
	}

	const root = main.cloneNode(true) as Element;

	root
		.querySelectorAll("script, style, header, footer")
		.forEach((script) => script.remove());

	const result = await format(root.innerHTML, {
		parser: "html",
		plugins: [prettierPluginHTML],
	});

	return result;
};

export const getPosts = (doc: Document | undefined, selectors: Selectors) => {
	if (!doc) {
		return [];
	}

	try {
		const items = doc.querySelectorAll<HTMLElement>(selectors.item);

		return Array.from(items).map((item) => {
			return {
				heading: getElementText(item, selectors.heading),
				date: getDate(item, selectors.date),
				url: getLink(item, selectors.anchor),
				description: getElementText(item, selectors.description),
			};
		});
	} catch {
		return [];
	}
};

export const getSelectors = (doc: Document): Selectors | undefined => {
	const main = doc.querySelector("main") ?? doc.body;

	const potential: [string, HTMLElement[]][] = [];

	const traverse = (element: HTMLElement, level: number) => {
		const children = Array.from(element.children).filter(
			(child) => !["SCRIPT", "LINK", "NAV"].includes(child.tagName),
		) as HTMLElement[];

		const grouped = groupBy(children, getSelector);

		potential.push(
			...Object.entries(grouped).filter(
				([_key, elements]) => elements.length >= 2,
			),
		);

		children.forEach((child) => traverse(child, level + 1));
	};

	traverse(main, 1);

	const parsed = potential.map(([key, elements]) => {
		const element = elements[0];

		return {
			itemSelector: key,
			anchor: getAnchor(element),
			heading: getHeading(element),
			date: findDateElement(element),
			siblings: elements.length,
		};
	});

	let siblingCounts = parsed
		.map(({ siblings }) => siblings)
		.sort((a, b) => b - a)
		.filter((a, index, arr) => arr.indexOf(a) === index);

	const scored = parsed.map((item) => {
		let score = 0;

		if (siblingCounts.indexOf(item.siblings) === 0) score = score + 2;
		if (siblingCounts.indexOf(item.siblings) === 1) score++;
		if (item.anchor) score = score + 3;
		if (item.heading) score + 3;
		if (item.date) score + 3;

		return {
			...item,
			score,
		};
	});

	const sorted = scored.slice().sort((a, b) => {
		return b.score - a.score;
	});

	const winner = sorted[0];

	return {
		item: winner.itemSelector,
		anchor: winner.anchor ? getSelector(winner.anchor) : undefined,
		heading: winner.heading ? getSelector(winner.heading) : undefined,
		date: winner.date ? getSelector(winner.date) : undefined,
		description: "",
	};
};

const groupBy = <T extends unknown>(
	items: T[],
	callback: (item: T) => string,
) => {
	return items.reduce<Record<string, T[]>>((result, item) => {
		const groupKey = callback(item);

		result[groupKey] = result[groupKey] || [];
		result[groupKey].push(item);

		return result;
	}, {});
};

const getElementText = (parent: HTMLElement, selector: string | undefined) => {
	if (!selector) {
		return;
	}

	try {
		return parent.querySelector<HTMLElement>(selector)?.innerText;
	} catch {
		return;
	}
};

const getDate = (parent: HTMLElement, selector: string | undefined) => {
	const dateText = getElementText(parent, selector);

	if (!dateText) {
		return;
	}

	const date = new Date(dateText);
	const timezoneOffset = date.getTimezoneOffset() * 60000;

	return new Date(date.getTime() - timezoneOffset).toUTCString();
};

const getLink = (parent: HTMLElement, selector: string | undefined) => {
	if (!selector) {
		return;
	}

	const element = parent.querySelector<HTMLElement>(selector);

	if (!element) {
		return;
	}

	return element.getAttribute("href") ?? undefined;
};

const getSelector = (element: HTMLElement) => {
	if (!element.classList.length) {
		return element.tagName;
	}

	return `${element.tagName}.${Array.from(element.classList).join(".")}`;
};

const getAnchor = (element: HTMLElement) => {
	if (element.tagName === "A") {
		return element;
	}

	return element.querySelector("a");
};

const getHeading = (element: HTMLElement) => {
	const tagNames = ["h1", "h2", "h3", "h4", "h5", "h6"];

	for (const tagName of tagNames) {
		const heading = element.querySelector(tagName) as HTMLElement;

		if (heading) {
			return heading;
		}
	}
};

const findDateElement = (element: HTMLElement) => {
	const traverse = (child: HTMLElement): HTMLElement | undefined => {
		if (!child.innerText.match(/20\d\d/)) {
			return;
		}

		if (!child.children.length) {
			return child;
		}

		for (const c of child.children) {
			const found = traverse(c as HTMLElement);
			if (found) {
				return found;
			}
		}
	};

	return traverse(element);
};
