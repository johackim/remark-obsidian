import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkComment from 'remark-comment';
import plugin from '../src/index';

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

test('Should support **bold text** with an [[Internal link]]', async () => {
    const text = '**bold text** with [[Internal link]]';

    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/internal-link" title="Internal link">Internal link</a>');
    expect(output).toContain('<strong>bold text</strong>');
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

test('Should support baseUrl option', async () => {
    const text = '[[Internal link]]';
    const options = { baseUrl: '/foo' };

    const output = String(await remark().use(plugin, options).process(text));

    expect(output).toContain('<a href="/foo/internal-link" title="Internal link">Internal link</a>');
});

test('Should support [[#Heading]]', async () => {
    const text = '[[#Heading]]';

    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="#heading" title="Heading">Heading</a>');
});

test('Should resolve wikilinks using frontmatter permalink when markdownFiles list is provided', async () => {
    const text = 'Go to [[myfile]]';
    const options = { markdownFiles: [{ file: 'myfile.md', permalink: 'custom-link' }] };

    const output = String(await remark().use(plugin, options).process(text));

    expect(output).toContain('<a href="/custom-link" title="myfile">myfile</a>');
});

test('Should add not-found class to links that are not available on markdownFiles', async () => {
    const text = '[[Internal link]]';
    const options = { markdownFiles: [] };

    const output = String(await remark().use(plugin, options).process(text));

    expect(output).toContain('<a href="/internal-link" title="Internal link" class="not-found">Internal link</a>');
});

test('Should ignore embed links inside code blocks', async () => {
    const text = '`![[Embed Link]]`';

    const output = String(await remark().use(remarkHtml).use(plugin).process(text));

    expect(output).toContain('<code>![[Embed Link]]</code>');
});

test('Should support ![[Embed note]]', async () => {
    const text = '![[My Note]]';
    const options = { markdownFiles: [{ file: 'My Note.md', content: 'This is a note with **bold** text.' }] };

    const output = String(await remark().use(plugin, options).process(text));

    expect(output).toContain('<div class="embed-note"><p>This is a note with <strong>bold</strong> text.</p>\n</div>');
});

test('Should add not-found class to embed links that are not available on markdownFiles', async () => {
    const text = '![[Another Note]]';
    const options = { markdownFiles: [] };

    const output = String(await remark().use(plugin, options).process(text));

    expect(output).toContain('<div class="embed-note not-found">Note not found</div>');
});

test('Should support [[A & B]]', async () => {
    const text = '[[A & B]]';

    const output = String(await remark().use(plugin).process(text));

    expect(output).toContain('<a href="/a-and-b" title="A & B">A & B</a>');
});
