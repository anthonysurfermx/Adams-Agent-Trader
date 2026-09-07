import React from 'react';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import LandGrowthGuide from '../src/components/companion/LandGrowthGuide';

const base = { practice: false, available: 0, seeds: 0, reviewReady: 0, route: { index: 0, total: 8, complete: false }, disabled: false, onReview() {}, onBuild() {}, onSignIn() {} };
function render(overrides: Partial<typeof base> = {}) {
  return renderToStaticMarkup(<MemoryRouter><LandGrowthGuide {...base} {...overrides} /></MemoryRouter>);
}
const practice = render({ practice: true });
assert.match(practice, /Start my earned island/);
assert.doesNotMatch(practice, /<progress/);
const review = render({ reviewReady: 1, seeds: 1, available: 2 });
assert.match(review, /<button[^>]*>Review thesis/);
assert.doesNotMatch(review, /<button[^>]*>Place a ready piece/);
assert.match(render({ available: 2 }), /<button[^>]*>Place a ready piece/);
assert.match(render({ seeds: 1 }), /Your seeds are waiting/);
assert.doesNotMatch(render({ seeds: 1 }), /<button[^>]*>Review thesis/);
const complete = render({ route: { index: 8, total: 8, complete: true } });
assert.match(complete, /route has no more pieces/);
assert.doesNotMatch(complete, /earn your next seed/);
assert.match(render({ available: 1, disabled: true }), /<button[^>]*disabled/);
console.log('PASS: practice separation, review priority, building, waiting, completed route and disabled actions');

const { fetchPublicWorlds } = await import('../src/lib/trader-land/public');
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => new Response('<html>Missing API</html>', { status: 200 });
  await assert.rejects(fetchPublicWorlds(), /Worlds unavailable/);
  globalThis.fetch = async () => Response.json({ ok: true, worlds: [], catalog: [] });
  assert.deepEqual((await fetchPublicWorlds()).worlds, []);
  globalThis.fetch = async () => Response.json({ ok: false, worlds: [], catalog: [] });
  await assert.rejects(fetchPublicWorlds(), /Worlds unavailable/);
} finally { globalThis.fetch = originalFetch; }
console.log('PASS: unavailable gallery is distinct from a valid empty community');
