import fs from 'fs';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import { unified } from 'unified';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmStrikethroughToMarkdown } from 'mdast-util-gfm-strikethrough';
import remarkGfm from 'remark-gfm';
import slugify from 'slugify';
import { remark } from 'remark';

const BRACKET_LINK_REGEX = /\[\[([a-zA-ZÀ-ÿ0-9-'?%.():&,+/€! ]+)#?([a-zA-ZÀ-ÿ0-9-'?%.():&,+/€! ]+)?\|?([a-zA-ZÀ-ÿ0-9-'?%.():&,+/€! ]+)?\]\]/g;
const EMBED_LINK_REGEX = /!\[\[([a-zA-ZÀ-ÿ0-9-'?%.():&,+/€! ]+)\]\]/g;

const defaultTitleToURL = (title) => `/${slugify(title, { lower: true })}`;

const tocTitles = ['table of contents', 'table des matières'];

const removeIgnoreParts = (tree) => {
    const start = tree.children.findIndex(({ commentValue }) => commentValue === 'ignore');
    const end = tree.children.findIndex(({ commentValue }) => commentValue === 'end ignore');

    if (start === -1) return;

    const elementsToDelete = (end === -1 ? tree.children.length : end) - start + 1;
    tree.children.splice(start, elementsToDelete);

    removeIgnoreParts(tree);
};

export const parseBracketLink = (bracketLink, titleToUrl = defaultTitleToURL) => {
    const [match] = bracketLink.matchAll(BRACKET_LINK_REGEX);

    if (!match) return bracketLink;

    const [, link, heading, text] = match;

    if (heading && text) {
        return { href: `${titleToUrl(link)}#${slugify(heading, { lower: true })}`, title: text };
    }

    if (heading) {
        return { href: `${titleToUrl(link)}#${slugify(heading, { lower: true })}`, title: link };
    }

    if (text) {
        return { href: titleToUrl(link), title: text };
    }

    return { href: titleToUrl(link), title: link };
};

const plugin = (options = {}) => (tree) => {
    removeIgnoreParts(tree);

    const { markdownFolder = `${process.cwd()}/content`, titleToUrl = defaultTitleToURL, toc = [], headings = [] } = options;

    visit(tree, 'heading', (node, index, parent) => {
        const isDetectH2Toc = node.depth === 2 && tocTitles.includes(node.children[0].value.toLowerCase());

        if (isDetectH2Toc) {
            const siblings = parent.children;
            const next = siblings[index + 1];

            if (next.type === 'list') {
                for (const item of next.children) {
                    const bracketLink = item.children[0].children[0].value;
                    const isSecondLevelExist = item.children[1]?.type === 'list';

                    if (isSecondLevelExist) {
                        const links = item.children[1].children
                            .map((i) => ({
                                ...parseBracketLink(i.children[0].children[0].value),
                                group: bracketLink,
                            }));

                        toc.push(...links);
                    } else {
                        toc.push(parseBracketLink(bracketLink, titleToUrl));
                    }
                }
            }
        }
    });

    visit(tree, 'heading', (node) => {
        if (node.depth === 2) {
            headings.push(node.children[0].value);
        }
    });

    visit(tree, 'paragraph', (node, index, parent) => {
        const markdown = toMarkdown(node, { extensions: [gfmFootnoteToMarkdown(), gfmStrikethroughToMarkdown] });
        const paragraph = String(unified().use(remarkParse).use(remarkHtml).processSync(markdown));

        if (paragraph.match(EMBED_LINK_REGEX)) {
            const [, fileName] = EMBED_LINK_REGEX.exec(paragraph);
            const filePath = `${markdownFolder}/${fileName}.md`;

            if (node.children.some(({ type }) => type === 'inlineCode') || !fs.existsSync(filePath)) {
                return node;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const embedTree = remark().use(remarkFrontmatter).use(remarkGfm).parse(content);

            plugin(options)(embedTree);

            parent.children.splice(index, 1, embedTree);

            return node;
        }

        if (paragraph.match(BRACKET_LINK_REGEX)) {
            const html = paragraph.replace(
                BRACKET_LINK_REGEX,
                (bracketLink, link, heading, text) => {
                    if (node.children.some(({ value, type }) => value === bracketLink && type === 'inlineCode')) {
                        return bracketLink;
                    }

                    if (heading && text) {
                        return `<a href="${titleToUrl(link, markdownFolder)}#${slugify(heading, { lower: true })}" title="${text}">${text}</a>`;
                    }

                    if (heading) {
                        return `<a href="${titleToUrl(link, markdownFolder)}#${slugify(heading, { lower: true })}" title="${link}">${link}</a>`;
                    }

                    if (text) {
                        return `<a href="${titleToUrl(link, markdownFolder)}" title="${text}">${text}</a>`;
                    }

                    return `<a href="${titleToUrl(link, markdownFolder)}" title="${link}">${link}</a>`;
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

export default plugin;
