import { Type } from 'main.core';

import { CodeProtector } from './utils/code-protector.js';
import { EscapeHandler } from './utils/escape-handler.js';
import { MentionProtector } from './utils/mention-protector.js';
import { createMarkdownNonce } from './utils/nonce.js';
import { applyBlockRules } from './rules/block-rules.js';
import { applyInlineRules, restoreInlineCode } from './rules/inline-rules.js';
import { applyHtmlRules } from './rules/html-rules.js';
import { convertLists, ListTagProtector } from './rules/list-rules.js';
import { convertTables, TableMarkerProtector } from './rules/table-rules.js';

// Fast-path: skip the whole pipeline when the text carries no Markdown-significant shape.
// Deliberately NOT triggered by a bare "[" or "=" — those appear in ordinary BB-code
// ([USER=…], [URL=…], [DISK=…]) which has no Markdown to convert. Instead each real shape
// is matched precisely: link/image via "](", setext-H1 via "={3}", list bullets/ordered
// markers via the line-anchored alternation, rules/setext-H2/table separators via "-{3}".
const MARKDOWN_TRIGGER = /[\t!#&*+<>\\_`|~]|\]\(|^[ \t]*(?:-|\d+\.)[ \t]|-{3}|={3}/m;

class MarkdownConverter
{
	/**
	 * Convert Markdown to BB-codes for full message rendering.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	static decode(text: string): string
	{
		return MarkdownConverter.#convert(text, { mode: 'decode' });
	}

	/**
	 * Convert Markdown to BB-codes for preview/notification text.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	static simplify(text: string): string
	{
		return MarkdownConverter.#convert(text, { mode: 'simplify' });
	}

	/**
	 * @param {string} text
	 * @param {object} tableOptions
	 * @returns {string}
	 */
	static #convert(text: string, tableOptions: Object): string
	{
		if (!Type.isStringFilled(text))
		{
			return '';
		}

		if (!MARKDOWN_TRIGGER.test(text))
		{
			return text;
		}

		// One per-render nonce shared by the placeholder protectors so a sender cannot type a
		// literal placeholder copy and have a stored block replicated into it on restore
		// (amplification DoS; see utils/nonce.js). convertTables/convertLists run their own
		// self-contained cell protect→restore (applyCellInlineRules) with their own nonce.
		const nonce = createMarkdownNonce();
		const escapeHandler = new EscapeHandler();
		const codeProtector = new CodeProtector(nonce);
		const mentionProtector = new MentionProtector(nonce);
		const tableMarkerProtector = new TableMarkerProtector(nonce);
		const listTagProtector = new ListTagProtector();

		text = codeProtector.protect(text);
		text = mentionProtector.protect(text);
		text = escapeHandler.protect(text);

		text = convertTables(text, tableOptions);
		text = convertLists(text, tableOptions);

		text = tableMarkerProtector.protect(text);
		text = listTagProtector.protect(text);

		text = applyBlockRules(text);
		const inlineCodeBlocks = [];
		text = applyInlineRules(text, inlineCodeBlocks, nonce);
		text = applyHtmlRules(text);
		text = restoreInlineCode(text, inlineCodeBlocks, nonce);

		text = listTagProtector.restore(text);
		text = tableMarkerProtector.restore(text);

		text = escapeHandler.restore(text);
		text = mentionProtector.restore(text);
		text = codeProtector.restore(text);

		return text;
	}
}

export { MarkdownConverter };
