import fs from 'node:fs';
import path from 'node:path';
import { artifactDir, getSecret, settings } from './store';
import { readStory, askModel } from './services';
import { validateStoryKey, validateHttpsUrl } from './policy';

export type TestCaseBundle = { key:string; storySummary:string; markdown:string; artifactPath:string; createdAt:string };
export type BugDraft = { storyKey:string; summary:string; steps:string; expected:string; actual:string; environment:string; evidencePath?:string };
const safeFile=(key:string)=>validateStoryKey(key);
function jiraAuth():{base:string;header:string} {
 const s=settings();
 if(!s.jiraBaseUrl || !s.jiraEmail) throw new Error('Configure Jira URL and account email');
 const base=validateHttpsUrl(s.jiraBaseUrl);
 return {base,header:'Basic '+Buffer.from(s.jiraEmail+':'+getSecret('jira-api-token')).toString('base64')};
}
async function jiraRequest(pathname:string, init:RequestInit):Promise<Response> {
 const {base,header}=jiraAuth();
 const response=await fetch(base+pathname,{...init,headers:{Authorization:header,Accept:'application/json',...init.headers},signal:AbortSignal.timeout(25000),redirect:'error'});
 if(!response.ok) throw new Error('Jira request failed: HTTP '+response.status);
 return response;
}
export async function generateCases(key:string):Promise<TestCaseBundle>{
 safeFile(key);
 const story=await readStory(key);
 const markdown=await askModel('Create a Markdown test case specification. Include a coverage matrix, test case IDs, prerequisites, reproducible steps, test data placeholders, expected results, priority, and positive/negative/boundary cases. Clearly mark inferred behavior as needing confirmation. Do not invent execution outcomes. Work exclusively from this Jira story.',story);
 if(!markdown.trim())throw new Error('Model produced no test cases');
 const directory=path.join(artifactDir(),key);fs.mkdirSync(directory,{recursive:true,mode:0o700});
 const artifactPath=path.join(directory,'test-cases-'+Date.now()+'.md');
 fs.writeFileSync(artifactPath,'# '+key+' — '+story.summary+'\n\n'+markdown,{mode:0o600,flag:'wx'});
 return {key,storySummary:story.summary,markdown,artifactPath,createdAt:new Date().toISOString()};
}
export async function attachCases(key:string,artifactPath:string):Promise<{key:string;filename:string;attachmentId:string}>{
 safeFile(key);
 const directory=path.resolve(artifactDir(),key)+path.sep;
 const resolved=path.resolve(artifactPath);
 if(!resolved.startsWith(directory)||!/^test-cases-\d+\.md$/.test(path.basename(resolved)))throw new Error('Attachment must be a generated test-case artifact for this story');
 const stat=fs.statSync(resolved);if(!stat.isFile()||stat.size>1024*1024)throw new Error('Invalid attachment size');
 const form=new FormData();
 const filename=path.basename(resolved);
 form.append('file',new Blob([fs.readFileSync(resolved)],{type:'text/markdown'}),filename);
 const response=await jiraRequest('/rest/api/3/issue/'+encodeURIComponent(key)+'/attachments',{method:'POST',headers:{'X-Atlassian-Token':'no-check'},body:form});
 const data=await response.json() as Array<{id?:string}>;
 return {key,filename,attachmentId:String(data[0]?.id??'')};
}
export function validateBugDraft(raw:BugDraft):BugDraft {
 if(!raw||typeof raw!=='object')throw new Error('Missing bug draft');
 const storyKey=safeFile(String(raw.storyKey||''));
 const fields=['summary','steps','expected','actual','environment'] as const;
 for(const field of fields)if(typeof raw[field]!=='string'||!raw[field].trim()||raw[field].length>5000)throw new Error('Invalid bug field: '+field);
 const env=settings().environments.find(e=>e.name===raw.environment);
 if(!env)throw new Error('Select a configured environment');
 if(raw.evidencePath){
  const p=path.resolve(raw.evidencePath),root=path.resolve(artifactDir())+path.sep;
  if(!p.startsWith(root))throw new Error('Evidence must originate in the QA artifact workspace');
 }
 return {...raw,storyKey,summary:raw.summary.trim().slice(0,200)};
}
export async function submitBug(raw:BugDraft):Promise<{key:string;url:string}>{
 const bug=validateBugDraft(raw);
 const description=['Steps to reproduce:',bug.steps,'','Expected:',bug.expected,'','Actual:',bug.actual,'','Environment:',bug.environment,'','Related story:',bug.storyKey].join('\n');
 const paragraphs=description.split('\n').map(line=>({type:'paragraph',content:[{type:'text',text:line||' '}]}));
 const project=bug.storyKey.split('-')[0];
 const payload={fields:{project:{key:project},issuetype:{name:'Bug'},summary:bug.summary,description:{type:'doc',version:1,content:paragraphs},labels:['qa-buddy']}};
 const response=await jiraRequest('/rest/api/3/issue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const data=await response.json() as {key?:string};
 if(!data.key)throw new Error('Jira did not return a created issue key');
 const {base}=jiraAuth();
 // Evidence upload and issue-link creation are separate, explicit follow-ups; never claim they happened here.
 return {key:data.key,url:base+'/browse/'+encodeURIComponent(data.key)};
}
