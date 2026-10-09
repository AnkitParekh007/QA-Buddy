import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { browserSmoke, readStory, askModel } from './services';
import { history, saveHistory, saveSecret, saveSettings, settings, Settings } from './store';
import { validateHttpsUrl } from './policy';
function createWindow(){
 const win=new BrowserWindow({width:1260,height:850,minWidth:850,minHeight:570,backgroundColor:'#0c1020',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',e=>e.preventDefault());
 void win.loadFile(path.join(__dirname,'../ui/browser/index.html'));
}
function fromWindow(event:Electron.IpcMainInvokeEvent){if(!BrowserWindow.fromWebContents(event.sender))throw new Error('Unauthorized request')}
app.whenReady().then(()=>{
 ipcMain.handle('settings:get',(event)=>{fromWindow(event);return settings()});
 ipcMain.handle('settings:save',(event,raw:Settings)=>{fromWindow(event);if(!raw||typeof raw!=='object'||!Array.isArray(raw.environments))throw new Error('Invalid settings');
  const value:Settings={model:String(raw.model||'').slice(0,100),jiraBaseUrl:raw.jiraBaseUrl?validateHttpsUrl(raw.jiraBaseUrl):'',jiraEmail:String(raw.jiraEmail||'').slice(0,200),environments:raw.environments.slice(0,30).map(e=>({name:String(e.name).toUpperCase().slice(0,40),baseUrl:validateHttpsUrl(e.baseUrl),production:Boolean(e.production)}))};
  if(!value.model||new Set(value.environments.map(e=>e.name)).size!==value.environments.length)throw new Error('Invalid model or duplicate environment names');saveSettings(value);return value});
 ipcMain.handle('secret:save',(event,label:string,value:string)=>{fromWindow(event);if(!['jira-api-token','anthropic-api-key'].includes(label)||typeof value!=='string'||!value||value.length>10000)throw new Error('Invalid secret');saveSecret(label,value);return{ok:true}});
 ipcMain.handle('history:get',event=>{fromWindow(event);return history()});
 ipcMain.handle('story:read',(event,key:string)=>{fromWindow(event);return readStory(key)});
 ipcMain.handle('browser:smoke',(event,name:string)=>{fromWindow(event);return browserSmoke(name)});
 ipcMain.handle('chat:send',async(event,input:string)=>{fromWindow(event);if(typeof input!=='string'||!input.trim()||input.length>8000)throw new Error('Invalid message');
  const messages=history();messages.push({role:'user' as const,content:input,time:new Date().toISOString()});saveHistory(messages);
  try{const match=input.match(/\b[A-Z][A-Z0-9_]{1,19}-[1-9]\d{0,9}\b/);const story=match?await readStory(match[0]):undefined;const reply=await askModel(input,story);messages.push({role:'assistant' as const,content:reply,time:new Date().toISOString()});saveHistory(messages);return{reply,messages}}catch(err){throw new Error(err instanceof Error?err.message:'Agent request failed')}
 });
 createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
