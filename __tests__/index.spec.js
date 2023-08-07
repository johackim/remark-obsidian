import fs from 'fs';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkComment from 'remark-comment';
import plugin from '../src/index';
import { parseBracketLink } from '../src/utils';

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

test('Should parse bracket link', () => {
    const bracketLink = '[[Bracket link]]';

    const data = parseBracketLink(bracketLink);

    expect(data).toEqual({ title: 'Bracket link', href: '/bracket-link', slug: 'bracket-link' });
});

test('Should parse multiple bracket links', () => {
    const bracketLinks = ['[[Bracket link]]', '[[Bracket link]]'];

    const data = bracketLinks.map((bracketLink) => parseBracketLink(bracketLink));

    expect(data).toEqual([
        { title: 'Bracket link', href: '/bracket-link', slug: 'bracket-link' },
        { title: 'Bracket link', href: '/bracket-link', slug: 'bracket-link' },
    ]);
});

test('Should ignore content between "<!--ignore-->" and "<!--end ignore-->" HTML comments', async () => {
    const text = [
        'Hello world',
        '<!--ignore-->',
        'Private content',
        '<!--end ignore-->',
        '<!--ignore-->',
        'Private content',
        '<!--end ignore-->',
        'Bye world',
    ].join('\n');

    const output = String(await remark().use(remarkComment, { ast: true }).use(plugin).process(text));

    expect(output).toContain('Hello world');
    expect(output).toContain('Bye world');
    expect(output).not.toContain('Private content');
});

test('Should ignore content after "<!--ignore-->" HTML comment', async () => {
    const text = [
        'Hello world',
        '<!--ignore-->',
        'Private content',
    ].join('\n');

    const output = String(await remark().use(remarkComment, { ast: true }).use(plugin).process(text));

    expect(output).not.toContain('Private content');
});

test('Should display paywall after "<!-- private -->" HTML comment', async () => {
    const paywall = '<p>Only for members</p>';
    const text = [
        'Hello world',
        '<!-- private -->',
        'here the s3cr3t password',
    ].join('\n');

    const output = String(await remark().use(remarkComment, { ast: true }).use(plugin, { paywall }).process(text));

    expect(output).toContain(paywall);
    expect(output).not.toContain('s3cr3t');
});

test('Should support > [!CALLOUT]', async () => {
    const text = [
        '> [!NOTE]',
        '> This is a note',
    ].join('\n');

    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<blockquote class="callout note">');
    expect(output).toContain('<p>This is a note</p>');
});

test('Should support > [!CALLOUT] with custom title', async () => {
    const text = [
        '> [!NOTE] Custom title',
        '> This is a note',
    ].join('\n');

    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<blockquote class="callout note">');
    expect(output).toContain('<div class="callout-title-inner">Custom title</div>');
    expect(output).toContain('<p>This is a note</p>');
});

test('Should support > [!CALLOUT] with multiple lines', async () => {
    const text = [
        '> [!NOTE]',
        '> This is a note',
        '> with multiple lines',
    ].join('\n');

    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<blockquote class="callout note">');
    expect(output).toContain('<p>This is a note with multiple lines</p>');
});

test.skip('Should support ==highlight **bold text**==', async () => {
    const text = '==highlight **bold text**==';

    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<p><mark>highlight <b>bold text</b></mark></p>');
});

test.skip('Should support ![[Embed note#heading]]', async () => {
    // TODO
});
