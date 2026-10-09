import { app, safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
export type Env = { name: string; baseUrl: string; production: boolean };
export type Settings = { model: string; jiraBaseUrl: string; jiraEmail: string; environments: Env[] };
export type Message = { role:'user'|'assistant'; content:string; time:string };
const DEFAULT: Settings = {model:'claude-sonnet-4-5',jiraBaseUrl:'',jiraEmail:'',environments:[]};
function workspace(): string { const p=path.join(app.getPath('userData'),'qa-workspace');fs.mkdirSync(p,{recursive:true,mode:0o700});return p }
function read<T>(name:string,fallback:T):T { try {return JSON.parse(fs.readFileSync(path.join(workspace(),name),'utf8')) as T} catch {return fallback} }
function write(name:string,value:unknown):void { const dest=path.join(workspace(),name);const temp=dest+'.tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2),{mode:0o600});fs.renameSync(temp,dest) }
export const settings=()=>read<Settings>('settings.json',DEFAULT);
export const saveSettings=(s:Settings)=>write('settings.json',s);
export const history=()=>read<Message[]>('messages.json',[]);
export const saveHistory=(m:Message[])=>write('messages.json',m.slice(-200));
export const artifactDir=()=>{const p=path.join(workspace(),'artifacts');fs.mkdirSync(p,{recursive:true,mode:0o700});return p};
export function saveSecret(label:string,value:string):void {
 if(!safeStorage.isEncryptionAvailable())throw new Error('OS secure encryption is unavailable; refusing to save secret');
 const vault=read<Record<string,string>>('vault.json',{});
 vault[label]=safeStorage.encryptString(value).toString('base64');write('vault.json',vault);
}
export function getSecret(label:string):string {
 if(!safeStorage.isEncryptionAvailable())throw new Error('OS secure encryption is unavailable');
 const encrypted=read<Record<string,string>>('vault.json',{})[label];
 if(!encrypted)throw new Error(`Missing secret: ${label}`);
 return safeStorage.decryptString(Buffer.from(encrypted,'base64'));
}
