export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
	time: string;
}
export interface EnvProfile {
	name: string;
	baseUrl: string;
	production: boolean;
}
export interface Settings {
	model: string;
	jiraBaseUrl: string;
	jiraEmail: string;
	environments: EnvProfile[];
}
export interface CaseBundle {key:string;storySummary:string;markdown:string;artifactPath:string;createdAt:string}
export interface BugDraft {storyKey:string;summary:string;steps:string;expected:string;actual:string;environment:string;evidencePath?:string}
export interface BrowserPlan {environment:string;storyKey:string;path:string;expectedText?:string;expectedTitle?:string;login?:{username:string;usernameSelector:string;passwordSelector:string;submitSelector:string}}
export interface BrowserResult {runId:string;environment:string;storyKey:string;status:'passed'|'failed';checked:string[];error?:string;screenshot:string;trace:string;startedAt:string;finishedAt:string}
export interface QAApi {
 previewBrowserPlan(plan:BrowserPlan):Promise<BrowserPlan>;
 executeBrowserPlan(plan:BrowserPlan):Promise<BrowserResult>;
 browserRuns():Promise<BrowserResult[]>;
 attachBugEvidence(bugKey:string,storyKey:string,runId:string,approved:boolean):Promise<{bugKey:string;attachmentId:string;linked:boolean}>;
  generateCases(key:string):Promise<CaseBundle>;
  attachCases(key:string,artifactPath:string,approved:boolean):Promise<{key:string;filename:string;attachmentId:string}>;
  previewBug(draft:BugDraft):Promise<BugDraft>;
  submitBug(draft:BugDraft,approved:boolean):Promise<{key:string;url:string}>;
	settings(): Promise<Settings>;
	configure(settings: Settings): Promise<Settings>;
	saveSecret(label: string, value: string): Promise<{ ok: boolean }>;
	chat(message: string): Promise<{ reply: string; messages: ChatMessage[] }>;
	history(): Promise<ChatMessage[]>;
	readStory(
		key: string,
	): Promise<{
		key: string;
		summary: string;
		description: string;
		status: string;
	}>;
	smoke(
		envName: string,
	): Promise<{ title: string; url: string; screenshot: string }>;
}
declare global {
	interface Window {
		qa: QAApi;
	}
}
