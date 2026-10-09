import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage, Settings, CaseBundle, BugDraft } from './desktop-api';
@Component({
	selector: 'qa-root',
	standalone: true,
	imports: [CommonModule, FormsModule],
	template: ` <div class="layout">
		<aside>
			<h2>✦ QA Agent</h2>
			<small>Local-first desktop assistant</small>
			<button (click)="tab.set('chat')">◉ Conversation</button>
			<button (click)="tab.set('config')">
				⚙ Connections & environments
			</button>
			<section class="hint">
				<b>Quick actions</b
				><button
					(click)="
						draft =
							'Summarize Jira story DEMO-123 and propose detailed positive, negative and boundary test cases.';
						tab.set('chat')
					"
				>
					Generate test cases</button
				><button
					(click)="
						draft = 'Help me plan release sanity testing.';
						tab.set('chat')
					"
				>
					Release sanity plan
				</button>
			</section>
			<footer>v0.1 · Local pilot</footer>
		</aside>
		<main *ngIf="tab() === 'chat'">
			<header>
				<div>
					<h1>QA Workspace</h1>
					<p>
						Story analysis, test cases and testing from one window
					</p>
				</div>
				<span class="status">● Local session</span>
			</header>
      <section style="padding:12px 22px;border-bottom:1px solid #273047">
        <b>QA workflow</b>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <input [(ngModel)]="storyKey" placeholder="Jira story (e.g. QA-123)" aria-label="Jira story key" style="min-width:185px;padding:10px;border-radius:8px"/>
          <button (click)="generate()" [disabled]="busy()">Generate cases</button>
          <button *ngIf="bundle()" (click)="attach()" [disabled]="busy()">Review & attach cases to Jira</button>
          <button (click)="bugOpen.set(!bugOpen())">Bug draft</button>
        </div>
        <div *ngIf="bundle()" style="margin-top:8px;max-height:130px;overflow:auto;white-space:pre-wrap;font-size:12px">{{bundle()?.markdown}}</div>
        <div *ngIf="bugOpen()" style="display:grid;gap:8px;margin-top:10px">
          <input [(ngModel)]="bug.summary" placeholder="Bug summary" aria-label="Bug summary"/>
          <textarea [(ngModel)]="bug.steps" rows="2" placeholder="Reproduction steps"></textarea>
          <textarea [(ngModel)]="bug.expected" rows="2" placeholder="Expected"></textarea>
          <textarea [(ngModel)]="bug.actual" rows="2" placeholder="Actual"></textarea>
          <select [(ngModel)]="bug.environment"><option value="">Select environment</option><option *ngFor="let e of settings.environments" [value]="e.name">{{e.name}}</option></select>
          <button (click)="createBug()" [disabled]="busy()">Review & submit Jira bug</button>
        </div>
      </section>

			<div class="messages">
				<div *ngIf="messages().length === 0" class="welcome">
					<h2>What would you like to test?</h2>
					<p>
						Try “Read Jira story DEMO-123” or “Create test scenarios
						for password reset”.
					</p>
				</div>
				<article
					*ngFor="let m of messages()"
					[class.mine]="m.role === 'user'"
				>
					<div class="role">
						{{ m.role === 'user' ? 'You' : 'QA Agent' }}
					</div>
					<div class="content">{{ m.content }}</div>
				</article>
			</div>
			<div class="compose">
				<textarea
					[(ngModel)]="draft"
					(keydown.control.enter)="send()"
					rows="3"
					placeholder="Ask your QA assistant… (Ctrl+Enter to send)"
				></textarea>
				<div>
					<span
						>AI output is advisory; verify before Jira or production
						changes.</span
					><button
						[disabled]="busy() || !draft.trim()"
						(click)="send()"
					>
						{{ busy() ? 'Working…' : 'Send →' }}
					</button>
				</div>
			</div>
		</main>
		<main *ngIf="tab() === 'config'" class="config">
			<header>
				<h1>Connections & environments</h1>
				<p>
					Secrets are saved in the encrypted OS-backed vault, never in
					chats.
				</p>
			</header>
			<label
				>Model ID<input
					[(ngModel)]="settings.model"
					placeholder="claude-sonnet-4-5"
			/></label>
			<label
				>Jira URL<input
					[(ngModel)]="settings.jiraBaseUrl"
					placeholder="https://your-company.atlassian.net"
			/></label>
			<label
				>Jira account email<input
					[(ngModel)]="settings.jiraEmail"
					placeholder="qa@example.com"
			/></label>
			<button (click)="saveSettings()">Save settings</button>
			<h3>Save credential (replace existing label)</h3>
			<label
				>Credential name<select [(ngModel)]="secretLabel">
					<option value="anthropic-api-key">Anthropic API key</option>
					<option value="jira-api-token">Jira API token</option>
				</select></label
			>
			<label
				>Secret<input
					[(ngModel)]="secretValue"
					type="password"
					autocomplete="off"
			/></label>
			<button (click)="saveSecret()" [disabled]="!secretValue">
				Store securely
			</button>
			<h3>Test environments</h3>
			<div *ngFor="let env of settings.environments" class="environment">
				<b>{{ env.name }}</b> — {{ env.baseUrl }}
				<span>{{
					env.production ? 'PROD / read-only' : 'Non-production'
				}}</span
				><button (click)="smoke(env.name)" [disabled]="busy()">
					Open & capture screenshot
				</button>
			</div>
			<label
				>Environment name<input
					[(ngModel)]="newEnvName"
					placeholder="DEV" /></label
			><label
				>HTTPS URL<input
					[(ngModel)]="newEnvUrl"
					placeholder="https://dev.example.com" /></label
			><label
				><input type="checkbox" [(ngModel)]="newEnvProd" /> Production /
				read-only</label
			><button (click)="addEnv()">Add environment</button>
			<p class="notice">
				Browser smoke opens the environment homepage and captures
				evidence. Authenticated, multi-step testing is a subsequent
				milestone.
			</p>
		</main>
		<div class="toast" *ngIf="notice()">{{ notice() }}</div>
	</div>`,
})
export class AppComponent implements OnInit {
  storyKey='';bundle=signal<CaseBundle|null>(null);bugOpen=signal(false);
  bug:BugDraft={storyKey:'',summary:'',steps:'',expected:'',actual:'',environment:''};
  async generate(){if(this.busy())return;this.busy.set(true);try{this.bundle.set(await window.qa.generateCases(this.storyKey.trim().toUpperCase()));this.show('Test cases generated locally. Review before attachment.')}catch(e){this.show(String(e))}finally{this.busy.set(false)}}
  async attach(){const b=this.bundle();if(!b)return;if(!confirm('Attach reviewed test cases to Jira '+b.key+'?'))return;this.busy.set(true);try{const r=await window.qa.attachCases(b.key,b.artifactPath,true);this.show('Attached '+r.filename+' to '+r.key)}catch(e){this.show(String(e))}finally{this.busy.set(false)}}
  async createBug(){if(this.busy())return;this.busy.set(true);try{const draft=await window.qa.previewBug({...this.bug,storyKey:this.storyKey.trim().toUpperCase()});const text=['Create Jira bug in '+draft.storyKey.split('-')[0]+'?',draft.summary,'Steps: '+draft.steps,'Expected: '+draft.expected,'Actual: '+draft.actual,'Environment: '+draft.environment].join('\n\n');if(!confirm(text))return;const created=await window.qa.submitBug(draft,true);this.show('Created '+created.key+' at '+created.url)}catch(e){this.show(String(e))}finally{this.busy.set(false)}}
	tab = signal<'chat' | 'config'>('chat');
	messages = signal<ChatMessage[]>([]);
	busy = signal(false);
	notice = signal('');
	draft = '';
	settings: Settings = {
		model: 'claude-sonnet-4-5',
		jiraBaseUrl: '',
		jiraEmail: '',
		environments: [],
	};
	secretLabel = 'anthropic-api-key';
	secretValue = '';
	newEnvName = '';
	newEnvUrl = '';
	newEnvProd = false;
	async ngOnInit() {
		try {
			this.settings = await window.qa.settings();
			this.messages.set(await window.qa.history());
		} catch (e) {
			this.show(String(e));
		}
	}
	show(text: string) {
		this.notice.set(text);
	}
	async send() {
		const text = this.draft.trim();
		if (!text || this.busy()) return;
		this.draft = '';
		this.busy.set(true);
		this.messages.update((m) => [
			...m,
			{ role: 'user', content: text, time: new Date().toISOString() },
		]);
		try {
			const result = await window.qa.chat(text);
			this.messages.set(result.messages);
		} catch (e) {
			this.messages.update((m) => [
				...m,
				{
					role: 'assistant',
					content: 'Error: ' + String(e),
					time: new Date().toISOString(),
				},
			]);
		} finally {
			this.busy.set(false);
		}
	}
	async saveSettings() {
		try {
			this.settings = await window.qa.configure(this.settings);
			this.show('Settings saved');
		} catch (e) {
			this.show(String(e));
		}
	}
	async saveSecret() {
		try {
			await window.qa.saveSecret(this.secretLabel, this.secretValue);
			this.secretValue = '';
			this.show('Secret saved in encrypted vault');
		} catch (e) {
			this.show(String(e));
		}
	}
	async addEnv() {
		try {
			const env = {
				name: this.newEnvName.trim().toUpperCase(),
				baseUrl: this.newEnvUrl.trim(),
				production: this.newEnvProd,
			};
			this.settings.environments.push(env);
			this.settings = await window.qa.configure(this.settings);
			this.newEnvName = '';
			this.newEnvUrl = '';
			this.show('Environment added');
		} catch (e) {
			this.settings = await window.qa.settings();
			this.show(String(e));
		}
	}
	async smoke(name: string) {
		this.busy.set(true);
		try {
			const result = await window.qa.smoke(name);
			this.show('Captured ' + result.title + ' — ' + result.screenshot);
		} catch (e) {
			this.show(String(e));
		} finally {
			this.busy.set(false);
		}
	}
}
