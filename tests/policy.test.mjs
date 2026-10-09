import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
// Static safety tests that run even before dependencies are installed.
const policy=readFileSync(new URL('../electron/policy.ts',import.meta.url),'utf8');
const main=readFileSync(new URL('../electron/main.ts',import.meta.url),'utf8');
const preload=readFileSync(new URL('../electron/preload.ts',import.meta.url),'utf8');
test('HTTPS-only URL validation exists',()=>assert.match(policy,/u\.protocol !== 'https:'/));
test('main process disables renderer Node integration',()=>assert.match(main,/nodeIntegration:false/));
test('context isolation enabled',()=>assert.match(main,/contextIsolation:true/));
test('sandbox enabled',()=>assert.match(main,/sandbox:true/));
test('preload exposes narrow API',()=>{assert.match(preload,/contextBridge\.exposeInMainWorld/);assert.doesNotMatch(preload,/exposeInMainWorld\('require'/)});
test('there is no write-to-Jira IPC capability',()=>assert.doesNotMatch(main,/jira:(create|update|delete)/));
