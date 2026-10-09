import { contextBridge, ipcRenderer } from 'electron';
const invoke=(channel:string,...args:unknown[])=>ipcRenderer.invoke(channel,...args);
contextBridge.exposeInMainWorld('qa',Object.freeze({
 settings:()=>invoke('settings:get'),configure:(value:unknown)=>invoke('settings:save',value),
 saveSecret:(label:string,value:string)=>invoke('secret:save',label,value),
 chat:(message:string)=>invoke('chat:send',message),history:()=>invoke('history:get'),
 readStory:(key:string)=>invoke('story:read',key),smoke:(name:string)=>invoke('browser:smoke',name)
}));
