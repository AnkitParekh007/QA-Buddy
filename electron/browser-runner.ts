import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { artifactDir, getSecret, settings } from './store';
import { validateHttpsUrl, validateStoryKey } from './policy';

export type BrowserPlan = {
  environment:string; storyKey:string; path:string;
  expectedText?:string; expectedTitle?:string;
  login?:{username:string;usernameSelector:string;passwordSelector:string;submitSelector:string};
};
export type BrowserResult = {
  runId:string; environment:string; storyKey:string; status:'passed'|'failed';
  checked:string[]; error?:string; screenshot:string; trace:string; startedAt:string; finishedAt:string;
};
export function validatePlan(p:BrowserPlan):BrowserPlan {
 if(!p||typeof p!=='object')throw new Error('Missing browser plan');
 const storyKey=validateStoryKey(String(p.storyKey||''));
 const env=settings().environments.find(e=>e.name===p.environment);
 if(!env)throw new Error('Unknown environment');
 if(typeof p.path!=='string'||!p.path.startsWith('/')||p.path.startsWith('//')||p.path.length>1024||p.path.includes('\\'))throw new Error('Use an environment-relative URL path');
 const url=new URL(p.path,validateHttpsUrl(env.baseUrl));
 if(url.origin!==validateHttpsUrl(env.baseUrl)||url.username||url.password)throw new Error('Cross-origin navigation prohibited');
 if(!p.expectedText?.trim()&&!p.expectedTitle?.trim())throw new Error('Specify an observable text or title assertion');
 for(const value of [p.expectedText,p.expectedTitle])if(value!==undefined&&(typeof value!=='string'||value.length>500))throw new Error('Invalid assertion');
 if(p.login){
  if(env.production)throw new Error('Production login automation is disabled');
  const fields=[p.login.username,p.login.usernameSelector,p.login.passwordSelector,p.login.submitSelector];
  if(fields.some(v=>typeof v!=='string'||!v.trim()||v.length>250))throw new Error('Incomplete login configuration');
  for(const sel of fields.slice(1))if(!/^(#|\.|\[|input|button|[a-z][\w-]*[\[:.#])/i.test(sel))throw new Error('Unsupported selector');
 }
 return {...p,storyKey};
}
export async function executePlan(input:BrowserPlan):Promise<BrowserResult>{
 const plan=validatePlan(input), env=settings().environments.find(e=>e.name===plan.environment)!;
 const origin=validateHttpsUrl(env.baseUrl), runId=crypto.randomUUID();
 const dir=path.join(artifactDir(),'runs',runId);fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const screenshot=path.join(dir,'evidence.png'),trace=path.join(dir,'trace.zip');
 const startedAt=new Date().toISOString(),checked:string[]=[];
 const browser=await chromium.launch({headless:true});
 let status:'passed'|'failed'='passed',error:string|undefined;
 try {
  const context=await browser.newContext({acceptDownloads:false,serviceWorkers:'block',permissions:[]});
  await context.tracing.start({screenshots:false,snapshots:false,sources:false});
  const page=await context.newPage();
  await page.route('**/*',route=>{
    const req=route.request(),url=new URL(req.url());
    // No third-party requests in restricted pilot. Some complex applications may need a reviewed allowlist.
    if(!['http:','https:'].includes(url.protocol)||url.origin!==origin)return route.abort();
    if(env.production&&!['GET','HEAD','OPTIONS'].includes(req.method()))return route.abort();
    return route.continue();
  });
  await page.goto(new URL(plan.path,origin).toString(),{waitUntil:'domcontentloaded',timeout:30000});
  if(plan.login){
   const login=plan.login, password=getSecret('env-'+env.name+'-password');
   await page.locator(login.usernameSelector).first().fill(login.username,{timeout:10000});
   await page.locator(login.passwordSelector).first().fill(password,{timeout:10000});
   await page.locator(login.submitSelector).first().click({timeout:10000});
   await page.waitForLoadState('domcontentloaded',{timeout:15000}).catch(()=>{});
  }
  if(plan.expectedTitle){const actual=await page.title();if(!actual.includes(plan.expectedTitle))throw new Error('Page title assertion failed');checked.push('Title contains expected text')}
  if(plan.expectedText){await page.getByText(plan.expectedText,{exact:false}).first().waitFor({state:'visible',timeout:15000});checked.push('Expected text visible')}
  await page.screenshot({path:screenshot,fullPage:false,animations:'disabled'});
  await context.tracing.stop({path:trace});
  await context.close();
 }catch(e){
  status='failed';error=e instanceof Error?e.message.slice(0,300):'Browser execution failed';
  // Traces may include confidential page content. Protect the artifact directory and review before external upload.
  // Do not automatically export tracing or screenshots to Jira.
  if(!fs.existsSync(screenshot))fs.writeFileSync(screenshot,Buffer.alloc(0),{mode:0o600});
  if(!fs.existsSync(trace))fs.writeFileSync(trace,Buffer.alloc(0),{mode:0o600});
 }finally{await browser.close()}
 const result:BrowserResult={runId,environment:env.name,storyKey:plan.storyKey,status,checked,error,screenshot,trace,startedAt,finishedAt:new Date().toISOString()};
 fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2),{mode:0o600});
 return result;
}
export function listRuns():BrowserResult[]{
 const root=path.join(artifactDir(),'runs');if(!fs.existsSync(root))return [];
 return fs.readdirSync(root).slice(-50).map(id=>{try{return JSON.parse(fs.readFileSync(path.join(root,id,'result.json'),'utf8')) as BrowserResult}catch{return null}}).filter((r):r is BrowserResult=>!!r).reverse();
}
