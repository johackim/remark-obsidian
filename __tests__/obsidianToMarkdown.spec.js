import { remark } from 'remark';
import remarkHtml from 'remark-html';
import { obsidianToMarkdown } from '../src/index';

test('Should convert Obsidian markdown to markdown with obsidianToMarkdown', () => {
    const output = obsidianToMarkdown('start [[Internal link]] end');

    expect(output).toContain('<a href="/internal-link" title="Internal link">Internal link</a>');
});

test('Should remove the frontmatter with obsidianToMarkdown', () => {
    const output = obsidianToMarkdown('---\ntitle: Title\n---\n\nContent');

    expect(output).toBe('Content\n');
});

test('Should remove the ignored parts with obsidianToMarkdown', () => {
    const output = obsidianToMarkdown('Visible\n\n<!-- ignore -->\n\nHidden\n\n<!-- end ignore -->\n\nVisible too');

    expect(output).not.toContain('Hidden');
    expect(output).toContain('Visible too');
});

test('Should keep the checkbox of a task with an [[Internal link]] with obsidianToMarkdown', () => {
    const output = obsidianToMarkdown('- [ ] Install [[Internal link]]\n- [x] Done');

    expect(output).toContain('[ ] <p>Install <a href="/internal-link" title="Internal link">Internal link</a></p>');
    expect(output).toContain('[x] Done');
});

test('Should keep callouts as a single HTML block with obsidianToMarkdown', async () => {
    const markdown = obsidianToMarkdown('> [!NOTE]\n> This is a note');
    const output = String(await remark().use(remarkHtml, { sanitize: false }).process(markdown));

    expect(output).toContain('<div class="callout-content"><p>This is a note</p></div></blockquote>');
    expect(output).not.toContain('<pre>');
});
