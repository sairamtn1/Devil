import { type FormEvent, type ReactNode, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Shell, SectionHeading } from '@/App';
import {
  AlertTriangle,
  ArrowUpRight,
  Blocks,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

type UserStory = {
  id: string;
  role: string;
  goal: string;
  benefit: string;
  acceptanceCriteria: string[];
};

type DatabaseColumn = { name: string; type: string; constraints: string[] };
type DatabaseTable = { name: string; description: string; columns: DatabaseColumn[]; relations: string[] };
type DatabaseSchemaDesign = { tables: DatabaseTable[]; notes: string[] };

type ApiEndpoint = {
  method: string;
  path: string;
  description: string;
  requestBody: string;
  response: string;
  authRequired: boolean;
};
type ApiDesign = { baseUrl: string; authStrategy: string; endpoints: ApiEndpoint[] };

type FrontendArchitecture = {
  framework: string;
  routes: Array<{ path: string; purpose: string }>;
  keyComponents: string[];
  stateManagement: string;
  stylingApproach: string;
};

type BackendArchitecture = {
  framework: string;
  layers: Array<{ name: string; responsibility: string }>;
  services: string[];
  integrations: string[];
};

type FolderStructure = { tree: string; explanation: Array<{ path: string; purpose: string }> };

type ImplementationTask = {
  id: string;
  title: string;
  category: 'frontend' | 'backend' | 'database' | 'deployment' | 'general';
  description: string;
};

type MissionAnalysis = {
  projectName: string;
  requirements: string[];
  architecture: string[];
  databaseDesign: string[];
};

type ArchitectPlan = {
  missionId: string;
  projectId: string;
  projectName: string;
  goal: string;
  missionAnalysis: MissionAnalysis;
  requirements: string[];
  userStories: UserStory[];
  databaseSchema: DatabaseSchemaDesign;
  apiDesign: ApiDesign;
  frontendArchitecture: FrontendArchitecture;
  backendArchitecture: BackendArchitecture;
  folderStructure: FolderStructure;
  implementationTasks: ImplementationTask[];
  memoryUsed: boolean;
  createdAt: string;
};

async function createArchitectPlan(goal: string): Promise<ArchitectPlan> {
  const response = await fetch('/api/architect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Architect request failed (${response.status})`);
  }
  return response.json();
}

function SectionCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <AccordionItem value={label} className="border-[#292c34] px-1">
      <AccordionTrigger className="mono text-[11px] uppercase tracking-[.14em] text-[#d8a598] hover:no-underline">
        {label}
      </AccordionTrigger>
      <AccordionContent className="text-[13px] leading-relaxed text-[#c9c3bb]">{children}</AccordionContent>
    </AccordionItem>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function categoryTone(category: ImplementationTask['category']) {
  switch (category) {
    case 'frontend':
      return 'border-[#4a3a26] bg-[#241d13] text-[#d8a568]';
    case 'backend':
      return 'border-[#264a3a] bg-[#132419] text-[#68c78e]';
    case 'database':
      return 'border-[#2a3a4a] bg-[#131e24] text-[#68a8d8]';
    case 'deployment':
      return 'border-[#4a2626] bg-[#241313] text-[#d86868]';
    default:
      return 'border-[#39343a] bg-[#1c191e] text-[#b7a8d8]';
  }
}

function PlanView({ plan }: { plan: ArchitectPlan }) {
  return (
    <div className="panel p-5 md:p-7" data-testid="panel-architect-plan">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2a2d35] pb-6">
        <div>
          <p className="mono text-[9px] uppercase tracking-[.18em] text-[#d14a40]">
            Architecture dossier / {plan.missionId}
          </p>
          <h2 className="mt-3 max-w-2xl text-[22px] leading-snug tracking-[-.03em] text-[#eee8df]">
            {plan.projectName}
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] text-[#858a95]">{plan.goal}</p>
        </div>
        {plan.memoryUsed && (
          <Badge variant="outline" className="mono text-[9px] uppercase tracking-[.12em]" data-testid="badge-memory-used">
            Prior memory applied
          </Badge>
        )}
      </div>

      <Accordion type="multiple" defaultValue={['Mission analysis', 'Requirements']} className="mt-4">
        <SectionCard label="Mission analysis">
          <p className="mb-2 text-[#e2dcd4]">{plan.missionAnalysis.projectName}</p>
          <p className="mono mb-1 text-[9px] uppercase tracking-[.12em] text-[#7f8590]">Architecture notes</p>
          <List items={plan.missionAnalysis.architecture} />
        </SectionCard>

        <SectionCard label="Requirements">
          <List items={plan.requirements} />
        </SectionCard>

        <SectionCard label="User stories">
          <div className="space-y-4">
            {plan.userStories.map((story) => (
              <div key={story.id} className="border border-[#292c34] bg-[#15171c] p-3" data-testid={`story-${story.id}`}>
                <p className="text-[#e2dcd4]">
                  As a <span className="text-[#e6a597]">{story.role}</span>, I want{' '}
                  <span className="text-[#e6a597]">{story.goal}</span>, so that {story.benefit}.
                </p>
                {story.acceptanceCriteria.length > 0 && (
                  <div className="mt-2">
                    <p className="mono text-[9px] uppercase tracking-[.12em] text-[#7f8590]">Acceptance criteria</p>
                    <List items={story.acceptanceCriteria} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard label="Database schema">
          <div className="space-y-4">
            {plan.databaseSchema.tables.map((table) => (
              <div key={table.name} className="border border-[#292c34] bg-[#15171c] p-3" data-testid={`table-${table.name}`}>
                <p className="mono text-[12px] text-[#e6a597]">{table.name}</p>
                <p className="mt-1 text-[12px] text-[#9299a3]">{table.description}</p>
                <div className="mt-2 divide-y divide-[#242731]">
                  {table.columns.map((column) => (
                    <div key={column.name} className="flex items-center justify-between gap-3 py-1.5 text-[12px]">
                      <span className="mono text-[#c9c3bb]">{column.name}</span>
                      <span className="mono text-[#7f8590]">{column.type}</span>
                      <span className="text-right text-[10px] text-[#686e79]">{column.constraints.join(', ')}</span>
                    </div>
                  ))}
                </div>
                {table.relations.length > 0 && (
                  <div className="mt-2">
                    <p className="mono text-[9px] uppercase tracking-[.12em] text-[#7f8590]">Relations</p>
                    <List items={table.relations} />
                  </div>
                )}
              </div>
            ))}
            {plan.databaseSchema.notes.length > 0 && (
              <div>
                <p className="mono text-[9px] uppercase tracking-[.12em] text-[#7f8590]">Notes</p>
                <List items={plan.databaseSchema.notes} />
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard label="API design">
          <p className="mb-3 text-[12px] text-[#9299a3]">
            Base URL <span className="mono text-[#c9c3bb]">{plan.apiDesign.baseUrl}</span> · {plan.apiDesign.authStrategy}
          </p>
          <div className="divide-y divide-[#242731]">
            {plan.apiDesign.endpoints.map((endpoint) => (
              <div key={`${endpoint.method}-${endpoint.path}`} className="py-2.5" data-testid={`endpoint-${endpoint.method}-${endpoint.path}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono border border-[#3a3e47] px-1.5 py-0.5 text-[10px] text-[#e6a597]">{endpoint.method}</span>
                  <span className="mono text-[12px] text-[#e2dcd4]">{endpoint.path}</span>
                  {endpoint.authRequired && (
                    <span className="mono text-[9px] uppercase tracking-[.1em] text-[#68a8d8]">auth required</span>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-[#9299a3]">{endpoint.description}</p>
                <p className="mt-1 text-[11px] text-[#686e79]">Request: {endpoint.requestBody} · Response: {endpoint.response}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard label="Frontend architecture">
          <p className="mb-2 text-[#e2dcd4]">{plan.frontendArchitecture.framework}</p>
          <p className="mono mb-1 text-[9px] uppercase tracking-[.12em] text-[#7f8590]">Routes</p>
          <List items={plan.frontendArchitecture.routes.map((route) => `${route.path} — ${route.purpose}`)} />
          <p className="mono mb-1 mt-3 text-[9px] uppercase tracking-[.12em] text-[#7f8590]">Key components</p>
          <List items={plan.frontendArchitecture.keyComponents} />
          <p className="mt-3 text-[12px] text-[#9299a3]">
            State: {plan.frontendArchitecture.stateManagement} · Styling: {plan.frontendArchitecture.stylingApproach}
          </p>
        </SectionCard>

        <SectionCard label="Backend architecture">
          <p className="mb-2 text-[#e2dcd4]">{plan.backendArchitecture.framework}</p>
          <p className="mono mb-1 text-[9px] uppercase tracking-[.12em] text-[#7f8590]">Layers</p>
          <List items={plan.backendArchitecture.layers.map((layer) => `${layer.name} — ${layer.responsibility}`)} />
          <p className="mono mb-1 mt-3 text-[9px] uppercase tracking-[.12em] text-[#7f8590]">Services</p>
          <List items={plan.backendArchitecture.services} />
          {plan.backendArchitecture.integrations.length > 0 && (
            <>
              <p className="mono mb-1 mt-3 text-[9px] uppercase tracking-[.12em] text-[#7f8590]">Integrations</p>
              <List items={plan.backendArchitecture.integrations} />
            </>
          )}
        </SectionCard>

        <SectionCard label="Folder structure">
          <pre className="mono overflow-x-auto whitespace-pre border border-[#292c34] bg-[#0e1014] p-3 text-[11px] text-[#c9c3bb]">
            {plan.folderStructure.tree}
          </pre>
          <div className="mt-3">
            <List items={plan.folderStructure.explanation.map((entry) => `${entry.path} — ${entry.purpose}`)} />
          </div>
        </SectionCard>

        <SectionCard label="Implementation tasks">
          <div className="space-y-2">
            {plan.implementationTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 border border-[#292c34] bg-[#15171c] p-3" data-testid={`task-${task.id}`}>
                <span className={`mono shrink-0 border px-1.5 py-0.5 text-[9px] uppercase tracking-[.1em] ${categoryTone(task.category)}`}>
                  {task.category}
                </span>
                <p className="text-[12px] text-[#c9c3bb]">{task.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </Accordion>
    </div>
  );
}

function ArchitectComposer({ onPlanned }: { onPlanned: (plan: ArchitectPlan) => void }) {
  const [goal, setGoal] = useState('');
  const mutation = useMutation({
    mutationFn: createArchitectPlan,
    onSuccess: (plan) => onPlanned(plan),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = goal.trim();
    if (trimmed.length < 3 || mutation.isPending) return;
    mutation.mutate(trimmed);
  };

  return (
    <form onSubmit={submit} className="panel relative overflow-hidden p-5 md:p-7">
      <div className="absolute right-0 top-0 h-32 w-32 bg-[radial-gradient(circle_at_top_right,rgba(210,55,47,.14),transparent_68%)]" />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mono text-[10px] uppercase tracking-[.2em] text-[#d8463d]">Full architecture</p>
            <h2 className="mt-2 text-[21px] font-medium tracking-[-.03em] text-[#f2ede5]">What should DEVIL architect?</h2>
          </div>
          <div className="hidden border border-[#4a2826] bg-[#261718] px-2.5 py-1.5 sm:block">
            <span className="mono text-[9px] uppercase tracking-[.14em] text-[#c97e71]">9-section plan</span>
          </div>
        </div>
        <textarea
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="e.g. Build a movie ticket booking application"
          rows={3}
          className="w-full resize-none border border-[#363943] bg-[#111318] px-4 py-4 text-[14px] leading-relaxed text-[#e9e4dd] outline-none transition-colors placeholder:text-[#5d626c] focus:border-[#ad3e38] focus:ring-1 focus:ring-[#7d302c]"
          data-testid="input-architect-goal"
        />
        {mutation.isError && (
          <p className="mt-3 flex items-center gap-2 text-xs text-[#e68073]" data-testid="status-architect-error">
            <AlertTriangle size={13} /> {(mutation.error as Error)?.message ?? 'Architecture generation failed.'}
          </p>
        )}
        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="mono text-[9px] uppercase tracking-[.12em] text-[#686d78]">
            <Sparkles size={11} className="mr-1 inline text-[#d89565]" /> analysis, requirements, user stories, schema, API, frontend, backend, folders, tasks
          </p>
          <button
            type="submit"
            disabled={goal.trim().length < 3 || mutation.isPending}
            className="group flex items-center justify-center gap-2 bg-[#c83d36] px-5 py-3 text-[12px] font-semibold tracking-[.02em] text-[#fff3ed] transition-all hover:bg-[#e04a41] disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="button-submit-architect"
          >
            {mutation.isPending ? 'Architecting' : 'Generate architecture'}
            {mutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function Architect() {
  const [plan, setPlan] = useState<ArchitectPlan>();
  return (
    <Shell>
      <div className="enter-up">
        <SectionHeading
          eyebrow="Architect / 04"
          title="Turn a goal into a full build plan."
          detail="DEVIL Architect runs the existing memory, planner, and AI layers to produce mission analysis, requirements, user stories, database schema, API design, frontend and backend architecture, folder structure, and implementation tasks — in one pass."
          action={
            <div className="hidden items-center gap-2 md:flex">
              <Blocks size={14} className="text-[#c07868]" />
              <span className="mono text-[10px] text-[#8db59d]">memory + planner + AI</span>
            </div>
          }
        />
        <ArchitectComposer onPlanned={setPlan} />
      </div>
      <div className="mt-7">
        {plan ? (
          <PlanView plan={plan} />
        ) : (
          <div className="panel flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-11 w-11 items-center justify-center border border-[#49302c] bg-[#281b1b] text-[#d3594e]">
              <Blocks size={18} />
            </div>
            <p className="text-[15px] font-medium text-[#e2dcd4]">No architecture generated yet</p>
            <p className="mt-2 max-w-[320px] text-xs leading-relaxed text-[#777d87]">
              Describe an application above and DEVIL will return a complete build plan.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
