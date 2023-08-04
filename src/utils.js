import fs from 'fs';
import { parse } from 'yaml';
import slugify from 'slugify';
import { CODE_BLOCK_REGEX, BRACKET_LINK_REGEX } from './constants';

export const extractFrontmatter = (markdown) => {
    const frontmatter = markdown.match(/^---([\s\S]+?)---/);

    if (!frontmatter) return {};

    const [, frontmatterString] = frontmatter;

    return parse(frontmatterString);
};

export const titleToUrl = (title, folder) => {
    const path = `${folder}/${title}.md`;

    if (fs.existsSync(path)) {
        const markdown = fs.readFileSync(path, 'utf8');
        const { slug } = extractFrontmatter(markdown);

        return `/${slug}`;
    }

    return `/${slugify(title, { lower: true })}`;
};

export const removeIgnoreParts = (tree) => {
    const start = tree.children.findIndex(({ commentValue }) => commentValue?.trim() === 'ignore');
    const end = tree.children.findIndex(({ commentValue }) => commentValue?.trim() === 'end ignore');

    if (start === -1) return;

    const elementsToDelete = (end === -1 ? tree.children.length : end) - start + 1;
    tree.children.splice(start, elementsToDelete);

    removeIgnoreParts(tree);
};

export const addPaywall = (tree, paywall) => {
    if (!paywall) return;

    const start = tree.children.findIndex(({ commentValue }) => commentValue?.trim() === 'private');
    const end = tree.children.findIndex(({ commentValue }) => commentValue?.trim() === 'end private');

    if (start === -1) return;

    const elementsToReplace = (end === -1 ? tree.children.length : end) - start + 1;
    tree.children.splice(start, elementsToReplace, { type: 'html', value: paywall });

    addPaywall(tree);
};

export const fetchEmbedContent = (fileName, options) => {
    const filePath = `${options.markdownFolder}/${fileName}.md`;

    if (!fs.existsSync(filePath)) return null;

    return fs.readFileSync(filePath, 'utf8');
};

export const parseBracketLink = (bracketLink, titleToUrlFn = titleToUrl) => {
    const [match] = bracketLink.matchAll(BRACKET_LINK_REGEX);

    if (!match) return bracketLink;

    const [, link, heading, text] = match;
    const href = titleToUrlFn(link);

    return {
        href: heading ? `${href}#${slugify(heading, { lower: true })}` : href,
        title: text || (heading ? link : link),
        slug: href.replace(/\//g, ''),
    };
};

export const extractBracketLinks = (content, titleToUrlFn = titleToUrl) => {
    const links = content.replace(CODE_BLOCK_REGEX, '').match(BRACKET_LINK_REGEX) || [];
    return links.map((link) => parseBracketLink(link, titleToUrlFn));
};

export default {
    extractFrontmatter,
    extractBracketLinks,
    parseBracketLink,
    fetchEmbedContent,
    removeIgnoreParts,
    titleToUrl,
    addPaywall,
};
