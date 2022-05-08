import fs from 'fs';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import plugin, { parseBracketLink } from '../src/index';

test('Should support ==highlight text==', async () => {
    const text = '==highlight text==';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<p><mark>highlight text</mark></p>');
});

test('Should support ==**highlight text**==', async () => {
    const text = '==**highlight text**==';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<p><mark><b>highlight text</b></mark></p>');
});

test('Should support [[Internal link]]', async () => {
    const text = '[[Internal link]]';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/internal-link" title="Internal link">Internal link</a>');
});

test('Should support **markdown text** with an [[Internal link]]', async () => {
    const text = '**markdown text** with [[Internal link]]';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/internal-link" title="Internal link">Internal link</a>');
    expect(output).toContain('<strong>markdown text</strong>');
});

test('Should support [[Internal link]] with text around', async () => {
    const text = 'start [[Internal link]] end';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/internal-link" title="Internal link">Internal link</a>');
});

test('Should support [[Internal link|With custom text]]', async () => {
    const text = '[[Internal link|With custom text]]';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/internal-link" title="With custom text">With custom text</a>');
});

test('Should support multiple [[Internal link]] on the same paragraph', async () => {
    const text = 'start [[Internal link]] [[Second link]] end';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/internal-link" title="Internal link">Internal link</a>');
    expect(output).toContain('<a href="/second-link" title="Second link">Second link</a>');
});

test('Should support [[Internal link#heading]]', async () => {
    const text = '[[Internal link#heading]]';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/internal-link#heading" title="Internal link">Internal link</a>');
});

test('Should support [[Internal link#heading|With custom text]]', async () => {
    const text = '[[Internal link#heading|With custom text]]';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/internal-link#heading" title="With custom text">With custom text</a>');
});

test('Should support french accents', async () => {
    const text = '[[Productivité]]';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/productivite" title="Productivité">Productivité</a>');
});

test('Should support ![[Embed note]]', async () => {
    const text = fs.readFileSync(`${process.cwd()}/__tests__/fixtures/Test.md`, 'utf8');

    const options = { markdownFolder: `${process.cwd()}/__tests__/fixtures` };
    const output = String(await remark().use(plugin, options).process(text));

    expect(output).toContain('Hello world');
    expect(output).toContain('<a href="/internal-link" title="Internal link">Internal link</a>');
    expect(output).not.toContain('Embed note');
    expect(output).not.toContain('!');
    expect(output.trim().slice(-3)).toEqual('End');
});

test('Should ignore embed links inside code blocks', async () => {
    const text = '`![[Embed Link]]`';
    const output = String(await remark().use(remarkHtml).use(plugin).process(text));

    expect(output).toContain('<code>![[Embed Link]]</code>');
});

test('Should ignore bracket links inside code blocks', async () => {
    const text = '`[[Internal Link]]`';
    const output = String(await remark().use(remarkHtml).use(plugin).process(text));

    expect(output).toContain('<code>[[Internal Link]]</code>');
});

test('Should ignore highlights inside code blocks', async () => {
    const text = '`==Highlight==`';
    const output = String(await remark().use(remarkHtml).use(plugin).process(text));

    expect(output).toContain('<code>==Highlight==</code>');
});

test('Should extract table of content', async () => {
    const text = fs.readFileSync(`${process.cwd()}/__tests__/fixtures/Course.md`, 'utf8');
    const toc = [];

    String(await remark().use(plugin, { toc }).process(text));

    expect(toc).toEqual([
        { href: '/lesson-1', title: 'Lesson 1' },
        { href: '/lesson-2', title: 'Lesson 2' },
        { href: '/lesson-3', title: 'Lesson 3' },
    ]);
});

test('Should extract table of content with two levels', async () => {
    const text = fs.readFileSync(`${process.cwd()}/__tests__/fixtures/Course2.md`, 'utf8');
    const toc = [];

    String(await remark().use(plugin, { toc }).process(text));

    expect(toc).toEqual([
        { href: '/lesson-1', title: 'Lesson 1', group: 'Module 1 : Introduction' },
        { href: '/lesson-2', title: 'Lesson 2', group: 'Module 1 : Introduction' },
        { href: '/lesson-1', title: 'Lesson 1', group: 'Module 2 : Intermediaire' },
        { href: '/lesson-2', title: 'Lesson 2', group: 'Module 2 : Intermediaire' },
        { href: '/lesson-3', title: 'Lesson 3', group: 'Module 2 : Intermediaire' },
        { href: '/lesson-1', title: 'Lesson 1', group: 'Module 3 : Avancé' },
    ]);
});

test('Should parse bracket link', () => {
    const bracketLink = '[[Bracket link]]';
    const data = parseBracketLink(bracketLink);

    expect(data).toEqual({ title: 'Bracket link', href: '/bracket-link' });
});

test('Should parse multiple bracket links', () => {
    const bracketLinks = ['[[Bracket link]]', '[[Bracket link]]'];

    const data = bracketLinks.map((bracketLink) => parseBracketLink(bracketLink));

    expect(data).toEqual([
        { title: 'Bracket link', href: '/bracket-link' },
        { title: 'Bracket link', href: '/bracket-link' },
    ]);
});

test.skip('Should support ==highlight **bold text**==', async () => {
    const text = '==highlight **bold text**==';
    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<p><mark>highlight <b>bold text</b></mark></p>');
});

test.skip('Should support ![[Embed note#heading]]', async () => {
    // TODO
});
