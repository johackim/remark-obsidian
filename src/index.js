import { remark } from 'remark';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmStrikethroughToMarkdown } from 'mdast-util-gfm-strikethrough';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import slugify from 'slugify';
import { EMBED_LINK_REGEX, BRACKET_LINK_REGEX } from './constants';
import { removeIgnoreParts, addPaywall, titleToUrl, fetchEmbedContent } from './utils';

const plugin = (options = {}) => (tree) => {
    const {
        markdownFolder = `${process.cwd()}/content`,
        titleToUrlFn = titleToUrl,
        fetchEmbedContentFn = fetchEmbedContent,
        paywall = '<p>Paywall</p>',
    } = options;

    removeIgnoreParts(tree);
    addPaywall(tree, paywall);

    visit(tree, 'paragraph', (node, index, parent) => {
        const markdown = toMarkdown(node, { extensions: [gfmFootnoteToMarkdown(), gfmStrikethroughToMarkdown] });
        const paragraph = String(unified().use(remarkParse).use(remarkHtml).processSync(markdown));

        if (paragraph.match(EMBED_LINK_REGEX)) {
            const [, fileName] = EMBED_LINK_REGEX.exec(paragraph);

            if (node.children.some(({ type }) => type === 'inlineCode')) {
                return node;
            }

            const content = fetchEmbedContentFn(fileName, options);

            if (!content) return node;

            const embedTree = remark().use(remarkFrontmatter).use(remarkGfm).parse(content);

            plugin(options)(embedTree);

            parent.children.splice(index, 1, embedTree);

            return node;
        }

        if (paragraph.match(BRACKET_LINK_REGEX)) {
            const html = paragraph.replace(
                BRACKET_LINK_REGEX,
                (bracketLink, link, heading, text) => {
                    const href = titleToUrlFn(link, markdownFolder);

                    if (node.children.some(({ value, type }) => value === bracketLink && type === 'inlineCode')) {
                        return bracketLink;
                    }

                    if (heading && text) {
                        return `<a href="${href}#${slugify(heading, { lower: true })}" title="${text}">${text}</a>`;
                    }

                    if (heading) {
                        return `<a href="${href}#${slugify(heading, { lower: true })}" title="${link}">${link}</a>`;
                    }

                    if (text) {
                        return `<a href="${href}" title="${text}">${text}</a>`;
                    }

                    return `<a href="${href}" title="${link}">${link}</a>`;
                },
            );

            if (html === paragraph) return node;

            delete node.children; // eslint-disable-line

            return Object.assign(node, { type: 'html', value: html });
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

            delete node.children; // eslint-disable-line

            return Object.assign(node, { type: 'html', value: `<p>${html}</p>` });
        }

        return node;
    });
};

export { parseBracketLink, extractBracketLinks } from './utils';

export default plugin;
