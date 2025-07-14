import { remark } from 'remark';
import remarkObsidian from './src/index.js';

// Example without baseUrl (default behavior)
const markdown1 = '[[Hello world]]';
const result1 = String(await remark().use(remarkObsidian).process(markdown1));
console.log('Without baseUrl:', result1);

// Example with baseUrl
const markdown2 = '[[Hello world]]';
const options = { baseUrl: '/docs' };
const result2 = String(await remark().use(remarkObsidian, options).process(markdown2));
console.log('With baseUrl "/docs":', result2);

// Example with baseUrl and custom text
const markdown3 = '[[Hello world|Custom text]]';
const result3 = String(await remark().use(remarkObsidian, options).process(markdown3));
console.log('With baseUrl and custom text:', result3);

// Example with baseUrl and heading
const markdown4 = '[[Hello world#section]]';
const result4 = String(await remark().use(remarkObsidian, options).process(markdown4));
console.log('With baseUrl and heading:', result4);
