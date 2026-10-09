export interface ChatMessage { role: 'user' | 'assistant'; content: string; time: string }
export interface EnvProfile { name: string; baseUrl: string; production: boolean }
export interface Settings { model: string; jiraBaseUrl: string; jiraEmail: string; environments: EnvProfile[] }
export interface QAApi {
  settings(): Promise<Settings>;
  configure(settings: Settings): Promise<Settings>;
  saveSecret(label: string, value: string): Promise<{ ok: boolean }>;
  chat(message: string): Promise<{ reply: string; messages: ChatMessage[] }>;
  history(): Promise<ChatMessage[]>;
  readStory(key: string): Promise<{key:string;summary:string;description:string;status:string}>;
  smoke(envName:string): Promise<{title:string;url:string;screenshot:string}>;
}
declare global { interface Window { qa: QAApi } }
