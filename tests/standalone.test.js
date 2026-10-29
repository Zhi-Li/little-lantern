import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';
import {makeStandalone} from '../scripts/standalone.mjs';

test('double-clickable game includes current sources and has no external runtime dependencies',async()=>{
  const html=await makeStandalone();
  assert.ok(html===await readFile('play.html','utf8'),'play.html is stale; regenerate it with npm run build');
  assert.doesNotMatch(html,/<script\b[^>]*\bsrc\s*=/i);
  assert.doesNotMatch(html,/<link\b[^>]*rel="stylesheet"/i);
  assert.doesNotMatch(html,/@import\b/);
  assert.doesNotMatch(html,/(?:src|href)="\.\/(?:src\/|style\.css|favicon\.svg)/i);
  assert.match(html,/href="data:image\/svg\+xml;base64,/);
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);
  assert.doesNotThrow(()=>new Script(scripts[0][1],{filename:'play.html'}));
});
