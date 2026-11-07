import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
test('profil_org.mjs --selftest', () => { assert.match(execFileSync('node', ['scripts/panen/profil_org.mjs', '--selftest'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }), /selftest ok/); });
