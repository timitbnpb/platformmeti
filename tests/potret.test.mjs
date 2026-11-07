import test from 'node:test';
import { selftest } from '../scripts/pipa/potret.mjs';

test('potret: pemindai data pribadi, pemecahan 2 MB, pembagian lapis', () => selftest());
