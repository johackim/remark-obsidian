import { remark } from 'remark';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import { toMarkdown } from 'mdast-util-to-markdown';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import slugify from 'slugify';
import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmStrikethroughToMarkdown } from 'mdast-util-gfm-strikethrough';
import { BRACKET_LINK_REGEX, CALLOUT_REGEX, HEADING_REGEX, ICONS, EMBED_LINK_REGEX } from './constants';
import { removeIgnoreParts, addPaywall } from './utils';

const plugin = (options) => (tree) => {
    const {
        baseUrl = '',
        markdownFiles,
        paywall = '<p>Paywall</p>',
    } = options || {};

    const titleToUrl = (title) => {
        const file = markdownFiles && markdownFiles.find((f) => f.file === `${title}.md`);

        if (file && file.permalink) {
            return `/${file.permalink}`;
        }

        return `/${slugify(title, { lower: true })}`;
    };

    removeIgnoreParts(tree);
    addPaywall(tree, paywall);

    // eslint-disable-next-line complexity
    visit(tree, 'paragraph', (node) => {
        const markdown = toMarkdown(node, { extensions: [gfmFootnoteToMarkdown(), gfmStrikethroughToMarkdown] });
        const paragraph = String(unified().use(remarkParse).use(remarkHtml).processSync(markdown));

        if (paragraph.match(EMBED_LINK_REGEX)) {
            const html = paragraph.replace(
                EMBED_LINK_REGEX,
                (embedLink, link) => {
                    if (node.children.some(({ value, type }) => value === embedLink && type === 'inlineCode')) {
                        return embedLink;
                    }

                    const file = markdownFiles && markdownFiles.find((f) => f.file === `${link}.md`);

                    if (file?.content) {
                        const content = remark().use(remarkFrontmatter).use(remarkGfm).use(remarkHtml)
                            .processSync(file.content);
                        return `<div class="embed-note">${content}</div>`;
                    }

                    return '<div class="embed-note not-found">Note not found</div>';
                },
            );

            if (html === paragraph) return node;

            delete node.children; // eslint-disable-line no-param-reassign

            return Object.assign(node, { type: 'html', value: html });
        }

        if (paragraph.match(BRACKET_LINK_REGEX)) {
            const html = paragraph.replace(
                BRACKET_LINK_REGEX,
                // eslint-disable-next-line complexity
                (bracketLink, link, heading, text) => {
                    const href = titleToUrl(link);
                    const fullHref = baseUrl + href;
                    const isNotFound = markdownFiles && !markdownFiles.find((f) => f.file === `${link}.md`);

                    if (node.children.some(({ value, type }) => value === bracketLink && type === 'inlineCode')) {
                        return bracketLink;
                    }

                    if (heading && text) {
                        return `<a href="${fullHref}#${slugify(heading, { lower: true })}" title="${text}"${isNotFound ? ' class="not-found"' : ''}>${text}</a>`;
                    }

                    if (heading) {
                        return `<a href="${fullHref}#${slugify(heading, { lower: true })}" title="${link}"${isNotFound ? ' class="not-found"' : ''}>${link}</a>`;
                    }

                    if (text) {
                        return `<a href="${fullHref}" title="${text}"${isNotFound ? ' class="not-found"' : ''}>${text}</a>`;
                    }

                    return `<a href="${fullHref}" title="${link}"${isNotFound ? ' class="not-found"' : ''}>${link}</a>`;
                },
            );

            if (html === paragraph) return node;

            delete node.children; // eslint-disable-line no-param-reassign

            return Object.assign(node, { type: 'html', value: html });
        }

        if (paragraph.match(HEADING_REGEX)) {
            const match = HEADING_REGEX.exec(paragraph);

            if (match && match[1]) {
                const heading = match[1];
                const html = `<a href="#${slugify(heading, { remove: /[.,]/g, lower: true })}" title="${heading}">${heading}</a>`;
                delete node.children; // eslint-disable-line no-param-reassign
                return Object.assign(node, { type: 'html', value: html });
            }
        }

        return node;
    });

    visit(tree, 'blockquote', (node, index, parent) => {
        const blockquote = toString(node);

        if (blockquote.match(CALLOUT_REGEX)) {
            const [, type, title] = CALLOUT_REGEX.exec(blockquote);
            const content = blockquote.replace(CALLOUT_REGEX, '').trim().replace(/\n/g, ' ');
            const icon = ICONS[type.toLowerCase()];

            const html = {
                type: 'html',
                value: `<blockquote class="callout ${type.toLowerCase()}">
                    ${(icon || title) ? `
                        <div class="callout-title">
                            ${icon ? `<div class="callout-icon">${icon}</div>` : ''}
                            <div class="callout-title-inner">${title || type.toLowerCase()}</div>
                        </div>
                    ` : ''}
                    <div class="callout-content">
                        <p>${content}</p>
                    </div>
                </blockquote>`,
            };

            parent.children.splice(index, 1, html);

            return node;
        }

        return node;
    });

    visit(tree, 'paragraph', (node) => {
        const paragraph = toString(node);
        const highlightRegex = /==(.*)==/g;

        if (paragraph.match(highlightRegex)) {
            const html = paragraph.replace(highlightRegex, (markdown, text) => {
                if (node.children.some(({ value, type }) => value === markdown && type === 'inlineCode')) {
                    return markdown;
                }

                if (node.children.some((n) => n.type === 'strong' && text === toString(n))) {
                    return `<mark><b>${text}</b></mark>`;
                }

                return `<mark>${text}</mark>`;
            });

            if (html === paragraph) return node;

            delete node.children; // eslint-disable-line no-param-reassign

            return Object.assign(node, { type: 'html', value: `<p>${html}</p>` });
        }

        return node;
    });
};

export default plugin;
