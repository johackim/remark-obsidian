# remark-obsidian

[![Version](https://img.shields.io/npm/v/remark-obsidian.svg?colorA=181C31&colorB=212839&label=version&sort=semver&style=flat-square)](https://www.npmjs.com/package/remark-obsidian)
[![License](https://img.shields.io/badge/license-GPL%20v3%2B-yellow.svg?style=flat-square&colorA=181C31&colorB=212839)](https://raw.githubusercontent.com/johackim/remark-obsidian/master/LICENSE.txt)

Remark plugin to support Obsidian markdown syntax.

## Requirements

- Nodejs >= 14

## Features

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

```js
import remarkObsidian from 'remark-obsidian';

const html = String(await remark().use(remarkObsidian).process('[[Hello world]]'));
console.log(html); // <a href="hello-world">Hello world</a>
```

## Running the tests

```bash
npm test
```

## License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE](https://raw.githubusercontent.com/johackim/remark-obsidian/master/LICENSE.txt) file for details

**Free Software, Hell Yeah!**
