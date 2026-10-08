import { nav, projects } from '../src/content.mjs';
import { renderPage } from '../src/render.mjs';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','public');
const routes=new Set(['/', '/privacy', ...nav.map(n=>n.path), ...nav.flatMap(n=>n.items.map(i=>i[1])), ...projects.map(p=>'/projects/'+p.id)]);
const missing=[];const files=new Set();
for(const route of routes){const page=renderPage(route);if(page.status!==200)missing.push(`${route}: status ${page.status}`);if(!page.html.includes('<html lang="ko">')||!/<h1(?:\s|>)/.test(page.html))missing.push(`${route}: missing page structure`);for(const match of page.html.matchAll(/(?:src|href)="(\/[^"#]*)"/g)){const url=match[1].split('?')[0];if(url.startsWith('/assets/')||url.startsWith('/downloads/')||/\.(css|js)$/.test(url)){files.add(url);try{await access(path.join(root,url))}catch{missing.push(`${route}: missing ${url}`)}}else if(!routes.has(url)&&renderPage(url).status!==200){missing.push(`${route}: broken link ${url}`)}}}
if(renderPage('/this-page-does-not-exist').status!==404)missing.push('Unknown pages must return 404');
if(missing.length){console.error(missing.join('\n'));process.exitCode=1}else console.log(`Verified ${routes.size} pages, ${files.size} static assets and internal links.`);
