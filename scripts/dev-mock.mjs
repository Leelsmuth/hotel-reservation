/**
 * `npm run dev:mock`: starts `next dev` with NEXT_PUBLIC_USE_MOCKS=true so the
 * app runs on dummy data without Firebase / Stripe / PayPal / email
 * credentials. Extra arguments are forwarded, e.g. `npm run dev:mock -- -p 4000`.
 *
 * Written in Node (rather than `NEXT_PUBLIC_USE_MOCKS=true next dev`) so it
 * also works in Windows shells.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');

console.log(`
  Mock mode: Firebase, Stripe, PayPal and email are replaced with dummy data.
  Log in with any demo account (password: Password123):
    jane@example.com · john@example.com · new@example.com
    unverified@example.com · admin@example.com
  Emails (incl. verification / reset links) are printed in this terminal.
  See README.md > "Mock mode" for all the dummy data.
`);

const child = spawn(
  process.execPath,
  [nextBin, 'dev', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, NEXT_PUBLIC_USE_MOCKS: 'true' },
  }
);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : code ?? 0);
});
