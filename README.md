# remark-obsidian

[![Version](https://img.shields.io/npm/v/remark-obsidian.svg?colorA=181C31&colorB=212839&label=version&sort=semver&style=flat-square)](https://www.npmjs.com/package/remark-obsidian)
[![License](https://img.shields.io/badge/license-GPL%20v3%2B-yellow.svg?style=flat-square&colorA=181C31&colorB=212839)](https://raw.githubusercontent.com/johackim/remark-obsidian/master/LICENSE.txt)

Remark plugin to support Obsidian markdown syntax.

## Requirements

- Nodejs >= 14

## Features

- [x] Support `> [!CALLOUT]`
- [x] Support `==highlight text==`
- [x] Support `[[Internal link]]`
- [x] Support `[[Internal link|With custom text]]`
- [x] Support `[[Internal link#heading]]`
- [x] Support `[[Internal link#heading|With custom text]]`
- [x] Support `![[Embed note]]`
- [ ] Support `![[Embed note#heading]]`

## Installation

```bash
yarn add -D remark-obsidian
```

## Usage

With [remark](https://github.com/remarkjs/remark/) :

```js
import { remark } from 'remark';
import remarkObsidian from 'remark-obsidian';

const html = String(await remark().use(remarkObsidian).process('[[Hello world]]'));
console.log(html); // <a href="/hello-world">Hello world</a>
```

With [unified](https://github.com/unifiedjs/unified) :

```js
import { unified } from 'unified'
import remarkObsidian from 'remark-obsidian';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const { value } = unified()
    .use(remarkParse)
    .use(remarkObsidian)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .processSync('[[Hello world]]');

console.log(value); // <a href="/hello-world">Hello world</a>
```

## Options

You can configure the plugin with options:

```js
import { remark } from 'remark';
import remarkObsidian from 'remark-obsidian';

const options = {
    markdownFolder: './content', // Default: `${process.cwd()}/content`
    baseUrl: '/docs', // Default: '' (empty string)
    // ... other options
};

const html = String(await remark().use(remarkObsidian, options).process('[[Hello world]]'));
console.log(html); // <a href="/docs/hello-world">Hello world</a>
```

### Available Options

- `markdownFolder` (string): Path to the markdown files directory. Default: `${process.cwd()}/content`
- `baseUrl` (string): Base URL to prepend to internal links. Default: `''` (empty string)
- `titleToUrl` (function): Custom function to convert titles to URLs
- `fetchEmbedContent` (function): Custom function to fetch embedded content
- `paywall` (string): HTML content to display for private content. Default: `'<p>Paywall</p>'`

## Running the tests

```bash
npm test
```

## License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE](https://raw.githubusercontent.com/johackim/remark-obsidian/master/LICENSE.txt) file for details

**Free Software, Hell Yeah!**
