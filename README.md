# remark-obsidian

[![Version](https://img.shields.io/github/tag/johackim/remark-obsidian.svg?label=Version&style=flat&colorA=2B323B&colorB=1e2329)](https://github.com/johackim/remark-obsidian/releases)
[![License](https://img.shields.io/badge/license-GPL%20v3%2B-yellow.svg?label=License&style=flat&colorA=2B323B&colorB=1e2329)](https://raw.githubusercontent.com/johackim/remark-obsidian/master/LICENSE.txt)

Remark plugin to support Obsidian markdown syntax.

## 📋 Requirements

- Nodejs >= 14

## ✨ Features

- [x] Support `> [!CALLOUT]`
- [x] Support `==highlight text==`
- [x] Support `[[Internal link]]`
- [x] Support `[[Internal link|With custom text]]`
- [x] Support `[[Internal link#heading]]`
- [x] Support `[[Internal link#heading|With custom text]]`
- [x] Support `![[Embed note]]`
- [ ] Support `![[Embed note#heading]]`

## 🚀 Installation

```bash
yarn add -D remark-obsidian
```

## 📦 Usage

With [remark](https://github.com/remarkjs/remark/) :

```js
import { remark } from 'remark';
import remarkObsidian from 'remark-obsidian';

const html = String(await remark().use(remarkObsidian).process('[[Hello world]]'));
console.log(html); // <a href="/hello-world">Hello world</a>
```

With [unified](https://github.com/unifiedjs/unified) :

```js
import { unified } from 'unified';
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

## 🎁 Support me

Please support me with a one-time or a monthly donation and help me continue my activities.

[![Github sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors)](https://github.com/sponsors/johackim/)

## 📜 License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE.txt](https://raw.githubusercontent.com/johackim/remark-obsidian/master/LICENSE.txt) file for details

**Free Software, Hell Yeah!**
