import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Architect from '@/pages/architect';
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Cpu,
  Database,
  FileCode2,
  Film,
  Gauge,
  History,
  LayoutDashboard,
  LayoutTemplate,
  Menu,
  Network,
  RefreshCw,
  Search,
  Server,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetDashboardQueryKey,
  getGetMissionQueryKey,
  getListActivityQueryKey,
  getListMissionsQueryKey,
  useCreateMission,
  useCreateChat,
  useGetDashboard,
  useGetMission,
  useListActivity,
  useListMissions,
} from '@workspace/api-client-react';
import {
  Route,
  Switch,
  Link,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

const timeAgo = (value?: string) => {
  if (!value) return 'just now';
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const formatDate = (value?: string) =>
  value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—';

function AppMark() {
  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center border border-[#db4038]/70 bg-[#611d1c] text-[#fff3ec] shadow-[0_0_24px_rgba(205,46,40,.18)]" aria-label="DEVIL mark">
      <span className="absolute left-[7px] top-[7px] h-2 w-2 rotate-45 border-l border-t border-[#ffb09b]" />
      <span className="mono text-[11px] font-medium tracking-[-.12em]">DV</span>
      <span className="absolute bottom-[7px] right-[7px] h-2 w-2 rotate-45 border-b border-r border-[#ffb09b]" />
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const links = [
    { href: '/', label: 'Mission control', icon: LayoutDashboard },
    { href: '/architect', label: 'Architect', icon: LayoutTemplate },
    { href: '/missions', label: 'Mission history', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings2 },
  ];
  return (
    <>
      {open && <button className="fixed inset-0 z-40 bg-[#050608]/70 md:hidden" onClick={onClose} aria-label="Close navigation" data-testid="button-close-navigation" />}
      <aside className={`devil-shell fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col border-r border-[#292c34] px-4 py-5 transition-transform duration-300 md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <AppMark />
            <div>
              <p className="text-[15px] font-semibold tracking-[.22em] text-[#f2eee8]">DEVIL</p>
              <p className="mono mt-0.5 text-[9px] uppercase tracking-[.16em] text-[#858a96]">autonomous production</p>
            </div>
          </Link>
          <button className="rounded-md p-1 text-[#858a96] hover:bg-[#242731] hover:text-[#efe9e1] md:hidden" onClick={onClose} aria-label="Close menu" data-testid="button-sidebar-close"><X size={16} /></button>
        </div>
        <div className="mt-10 px-2">
          <p className="mono mb-3 text-[9px] uppercase tracking-[.2em] text-[#686e7a]">Command layer</p>
          <nav className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? location === '/' : location.startsWith(href);
              return (
                <Link key={href} href={href} onClick={onClose} className={`group flex items-center gap-3 border px-3 py-3 text-[12px] font-medium transition-colors ${active ? 'border-[#682624] bg-[#381b1b] text-[#ffb0a2]' : 'border-transparent text-[#8d929d] hover:border-[#2f323b] hover:bg-[#1d2027] hover:text-[#e9e6e0]'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
                  <Icon size={16} strokeWidth={1.7} className={active ? 'text-[#e0493d]' : 'text-[#777d89] group-hover:text-[#cac4bb]'} />
                  <span>{label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#e0493d] shadow-[0_0_8px_rgba(224,73,61,.75)]" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto space-y-4">
          <div className="mx-2 signal-line opacity-50" />
          <div className="border border-[#282b33] bg-[#15171c] p-3">
            <div className="flex items-center gap-2">
              <span className="pulse-red h-1.5 w-1.5 rounded-full bg-[#e0493d]" />
              <span className="mono text-[9px] uppercase tracking-[.17em] text-[#a5a6aa]">Core online</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#6f7580]">The machine is awake.<br />Give it something difficult.</p>
          </div>
          <p className="mono px-2 text-[9px] tracking-[.08em] text-[#555b66]">DEVIL OS // v0.9.7</p>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-[#252831] px-5 md:px-9">
      <div className="flex items-center gap-3">
        <button className="rounded-md border border-[#2e313a] p-2 text-[#a1a4ab] hover:border-[#5b3030] hover:text-[#edaaa0] md:hidden" onClick={onOpen} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={17} /></button>
        <div className="hidden items-center gap-2 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#dd453c]" />
          <span className="mono text-[10px] uppercase tracking-[.18em] text-[#777d88]">Live command channel</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 border border-[#292d35] bg-[#15171b] px-3 py-2 sm:flex">
          <ShieldCheck size={14} className="text-[#c6a58f]" />
          <span className="mono text-[10px] tracking-[.08em] text-[#a3a5a7]">workspace / blacksite</span>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-full border border-[#69312f] bg-[#351b1b] text-[11px] font-semibold text-[#f0aea2] transition-colors hover:bg-[#4a2120]" aria-label="Operator profile" data-testid="button-operator-profile">OP</button>
      </div>
    </header>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="noise-layer min-h-[100dvh] bg-[#0e1014] text-[#e9e6e0]">
      <div className="flex min-h-[100dvh]">
        <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="min-w-0 flex-1">
          <Topbar onOpen={() => setMobileOpen(true)} />
          <main className="mx-auto w-full max-w-[1510px] px-5 py-7 md:px-9 md:py-9">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-[#dc4c42]">{eyebrow}</p>
        <h1 className="text-[28px] font-semibold tracking-[-.04em] text-[#f1ede7] md:text-[34px]">{title}</h1>
        {detail && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#858a95]">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#252831] ${className}`} />;
}

function QueryError({ label, retry }: { label: string; retry: () => void }) {
  return (
    <div className="panel flex min-h-[180px] flex-col items-center justify-center p-6 text-center">
      <AlertTriangle size={19} className="mb-3 text-[#e06a5c]" />
      <p className="text-sm font-medium text-[#e8d9d0]">Could not load {label}</p>
      <p className="mt-1 text-xs text-[#777d88]">The command channel did not answer.</p>
      <button onClick={retry} className="mt-4 flex items-center gap-2 border border-[#5c302f] px-3 py-2 text-xs text-[#e9aaa0] hover:bg-[#3a2020]" data-testid={`button-retry-${label.replaceAll(' ', '-')}`}><RefreshCw size={13} /> Retry connection</button>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const complete = status === 'complete';
  const active = status === 'executing' || status === 'active';
  return (
    <span className={`mono inline-flex items-center gap-1.5 border px-2 py-1 text-[9px] uppercase tracking-[.12em] ${complete ? 'border-[#345346] bg-[#182820] text-[#8bc0a0]' : active ? 'border-[#65342f] bg-[#321b1a] text-[#ee9b8b]' : 'border-[#49433a] bg-[#28251f] text-[#c9a77f]'}`}>
      {complete ? <Check size={11} /> : active ? <span className="h-1.5 w-1.5 rounded-full bg-[#e05247] pulse-red" /> : <Clock3 size={11} />}
      {status}
    </span>
  );
}

function MissionComposer({ onCreated }: { onCreated: (id: string) => void }) {
  const [goal, setGoal] = useState('');
  const createMission = useCreateMission();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = goal.trim();
    if (trimmed.length < 3 || createMission.isPending) return;
    createMission.mutate({ data: { goal: trimmed } }, {
      onSuccess: (mission) => {
        setGoal('');
        onCreated(mission.id);
      },
    });
  };
  return (
    <form onSubmit={submit} className="panel relative overflow-hidden p-5 md:p-7">
      <div className="absolute right-0 top-0 h-32 w-32 bg-[radial-gradient(circle_at_top_right,rgba(210,55,47,.14),transparent_68%)]" />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mono text-[10px] uppercase tracking-[.2em] text-[#d8463d]">New objective</p>
            <h2 className="mt-2 text-[21px] font-medium tracking-[-.03em] text-[#f2ede5]">What should DEVIL make real?</h2>
          </div>
          <div className="hidden border border-[#4a2826] bg-[#261718] px-2.5 py-1.5 sm:block">
            <span className="mono text-[9px] uppercase tracking-[.14em] text-[#c97e71]">Autonomous / armed</span>
          </div>
        </div>
        <div className="relative">
          <textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Describe the outcome. DEVIL will determine the route." rows={4} className="w-full resize-none border border-[#363943] bg-[#111318] px-4 py-4 text-[14px] leading-relaxed text-[#e9e4dd] outline-none transition-colors placeholder:text-[#5d626c] focus:border-[#ad3e38] focus:ring-1 focus:ring-[#7d302c]" data-testid="input-mission-goal" />
          <span className="mono absolute bottom-3 right-3 text-[9px] text-[#555a64]">{goal.length.toString().padStart(3, '0')} / 2000</span>
        </div>
        {createMission.isError && <p className="mt-3 flex items-center gap-2 text-xs text-[#e68073]" data-testid="status-mission-error"><AlertTriangle size={13} /> Objective was rejected. Try a clearer outcome.</p>}
        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="mono text-[9px] uppercase tracking-[.12em] text-[#686d78]"><Zap size={11} className="mr-1 inline text-[#d89565]" /> natural language accepted</p>
          <button type="submit" disabled={goal.trim().length < 3 || createMission.isPending} className="group flex items-center justify-center gap-2 bg-[#c83d36] px-5 py-3 text-[12px] font-semibold tracking-[.02em] text-[#fff3ed] transition-all hover:bg-[#e04a41] disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-submit-mission">
            {createMission.isPending ? 'Initializing mission' : 'Start mission'}
            {createMission.isPending ? <RefreshCw size={14} className="animate-spin" /> : <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
          </button>
        </div>
      </div>
    </form>
  );
}

function ChatPanel() {
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; plan?: any }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chat = useCreateChat();
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chat.isPending]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || chat.isPending) return;
    setMessages((current) => [...current, { role: 'user', content: trimmed }]);
    setMessage('');
    chat.mutate({ data: { message: trimmed, conversationId: conversationId ?? null } }, {
      onSuccess: (result) => {
        setConversationId(result.conversationId);
        setMessages((current) => [...current, { role: 'assistant', content: result.message, plan: result.plan }]);
      },
    });
  };
  return (
    <section className="panel overflow-hidden" data-testid="panel-devil-chat">
      <div className="flex items-center justify-between border-b border-[#292c34] px-5 py-4">
        <div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#d74b41]">DEVIL chat</p><h2 className="mt-1 text-base text-[#e8e2da]">Command the engine directly</h2></div>
        <span className="mono text-[9px] uppercase tracking-[.14em] text-[#7f9d8a]">Qwen link ready</span>
      </div>
      <div ref={scrollRef} className="max-h-[330px] min-h-[180px] space-y-3 overflow-y-auto p-5" data-testid="chat-message-history">
        {!messages.length && <div className="flex min-h-[150px] flex-col items-center justify-center text-center"><Sparkles size={18} className="mb-3 text-[#c25f54]" /><p className="text-sm text-[#d7d0c7]">Ask DEVIL anything.</p><p className="mt-1 max-w-sm text-xs leading-relaxed text-[#777d87]">Chat, planning, memory, and mission context now share the same command channel.</p></div>}
        {messages.map((item, index) => <div key={`${item.role}-${index}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] border px-3 py-2.5 text-xs leading-relaxed ${item.role === 'user' ? 'whitespace-pre-wrap border-[#71332f] bg-[#321b1b] text-[#f0d9d2]' : 'border-[#30343d] bg-[#171a20] text-[#cfc9c1]'}`}><p className="whitespace-pre-wrap">{item.content}</p>{item.plan?.analysis && <div className="mt-3 border-t border-[#343943] pt-3"><p className="mono text-[9px] uppercase tracking-[.16em] text-[#d47a6d]">Mission analysis</p><p className="mt-1 text-[11px] text-[#d7d0c7]">{item.plan.analysis.projectName}</p><ul className="mt-2 list-disc space-y-1 pl-4 text-[10px] text-[#9299a3]">{(item.plan.tasks?.tasks ?? item.plan.analysis.requirements ?? []).slice(0, 4).map((task: string) => <li key={task}>{task}</li>)}</ul></div>}</div></div>)}
        {chat.isPending && <div className="flex items-center gap-2 text-[11px] text-[#8d929d]" data-testid="chat-loading"><span className="h-1.5 w-1.5 rounded-full bg-[#de4d43] pulse-red" /> DEVIL is thinking through the objective...</div>}
        {chat.isError && <div className="flex items-center gap-2 text-[11px] text-[#e68073]" data-testid="chat-error"><AlertTriangle size={13} /> The Qwen command channel did not answer. Check the provider configuration and retry.</div>}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-[#292c34] p-4">
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask DEVIL to reason, plan, or remember..." className="min-w-0 flex-1 border border-[#353943] bg-[#111318] px-3 py-3 text-xs text-[#e9e4dd] outline-none placeholder:text-[#616772] focus:border-[#ad3e38]" data-testid="input-chat-message" />
        <button type="submit" disabled={!message.trim() || chat.isPending} className="flex w-11 items-center justify-center bg-[#c83d36] text-[#fff3ed] transition-colors hover:bg-[#e04a41] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message" data-testid="button-send-chat"><Send size={15} /></button>
      </form>
    </section>
  );
}

function SystemOverview({ dashboard, loading }: { dashboard?: any; loading: boolean }) {
  const items = [
    { label: 'AI core', value: dashboard?.aiCore ?? 'online', icon: Cpu, tone: 'red' },
    { label: 'Memory', value: dashboard?.memory ?? 'optimal', icon: Database, tone: 'warm' },
    { label: 'Throughput', value: dashboard?.speed ?? '—', icon: Gauge, tone: 'neutral' },
    { label: 'Connections', value: dashboard?.connections ?? 'secure', icon: Network, tone: 'cool' },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden border border-[#2b2e36] bg-[#2b2e36] md:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="bg-[#16181e] p-4 transition-colors hover:bg-[#1c1e25] md:p-5" data-testid={`status-${label.toLowerCase().replace(' ', '-')}`}>
          <div className="flex items-center justify-between">
            <span className="mono text-[9px] uppercase tracking-[.14em] text-[#707681]">{label}</span>
            <Icon size={14} className={tone === 'red' ? 'text-[#db4a40]' : tone === 'warm' ? 'text-[#cf9b6a]' : tone === 'cool' ? 'text-[#91a7a9]' : 'text-[#a2a4aa]'} />
          </div>
          {loading ? <Skeleton className="mt-4 h-5 w-20" /> : <p className="mt-4 text-[15px] font-medium capitalize tracking-[-.01em] text-[#e4ded6]">{String(value).replaceAll('_', ' ')}</p>}
          <div className="mt-3 flex items-center gap-1.5"><span className={`h-1 w-1 rounded-full ${tone === 'red' ? 'bg-[#de4d43]' : 'bg-[#789486]'}`} /><span className="mono text-[9px] uppercase tracking-[.1em] text-[#5f6570]">nominal</span></div>
        </div>
      ))}
    </div>
  );
}

function MissionProgress({ mission, loading, onView }: { mission?: any; loading?: boolean; onView?: () => void }) {
  if (loading) return <div className="panel p-6"><Skeleton className="h-4 w-28" /><Skeleton className="mt-5 h-6 w-4/5" /><Skeleton className="mt-8 h-2 w-full" /></div>;
  if (!mission) return (
    <div className="panel flex min-h-[230px] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center border border-[#49302c] bg-[#281b1b] text-[#d3594e]"><Terminal size={18} /></div>
      <p className="text-[15px] font-medium text-[#e2dcd4]">No active mission</p>
      <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-[#777d87]">Every finished outcome starts as a signal. Issue a new objective above.</p>
    </div>
  );
  const completeSteps = mission.steps?.filter((step: any) => step.status === 'complete').length ?? 0;
  const [showPlan, setShowPlan] = useState(false);
  const outcomeReady = mission.status === 'complete' && mission.outcome?.ready;
  return (
    <div className="panel p-5 md:p-6" data-testid="panel-active-mission">
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><p className="mono text-[10px] uppercase tracking-[.18em] text-[#d64b41]">Active mission</p><StatusPill status={mission.status} /></div><h2 className="mt-3 max-w-2xl text-[17px] leading-snug text-[#ede7de]">{mission.goal}</h2></div>
        <span className="mono shrink-0 text-[11px] text-[#c1b2a8]">{Math.round(mission.progress)}%</span>
      </div>
      <div className="mt-6 h-1.5 overflow-hidden bg-[#2a2c33]"><div className="h-full bg-gradient-to-r from-[#aa302e] to-[#e05246] transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, mission.progress))}%` }} /></div>
      <div className="mt-3 flex justify-between"><span className="mono text-[9px] uppercase tracking-[.12em] text-[#676c76]">{completeSteps} / {mission.steps?.length ?? 0} operations resolved</span><span className="mono text-[9px] text-[#676c76]">{timeAgo(mission.createdAt)}</span></div>
      {outcomeReady && <div className="mt-6 border border-[#355646] bg-[#14221b] p-4" data-testid="panel-mission-outcome">
        <div className="flex items-center justify-between gap-3">
          <div><p className="mono text-[9px] uppercase tracking-[.18em] text-[#8bc0a0]">Outcome delivered</p><h3 className="mt-2 text-sm font-medium text-[#e4eee7]">{mission.outcome.title}</h3><p className="mt-1 text-[11px] leading-relaxed text-[#9cb1a5]">{mission.outcome.description}</p></div>
          <Check size={18} className="shrink-0 text-[#91c7a0]" />
        </div>
        {mission.outcome.kind === 'image' && mission.outcome.assetUrl && <div className="mt-4 overflow-hidden border border-[#365343] bg-[#0c1310]"><img src={mission.outcome.assetUrl} alt={mission.outcome.title} className="aspect-video w-full object-cover" /><div className="flex items-center justify-between gap-3 p-3"><span className="mono text-[9px] uppercase tracking-[.12em] text-[#789385]">Generated visual</span><a href={mission.outcome.assetUrl} download className="text-[10px] font-medium text-[#aad0b6] hover:text-white" data-testid="link-download-outcome">Download result</a></div></div>}
      </div>}
      <div className="mt-5 border-t border-[#292c34] pt-4">
        <button onClick={() => setShowPlan((value) => !value)} className="flex w-full items-center justify-between text-left" aria-expanded={showPlan} data-testid="button-toggle-execution-plan"><span><span className="mono text-[9px] uppercase tracking-[.16em] text-[#777d88]">{showPlan ? 'Hide execution plan' : 'Show execution plan'}</span><span className="ml-2 text-[10px] text-[#555c67]">optional transparency</span></span><ChevronRight size={14} className={`text-[#777d88] transition-transform ${showPlan ? 'rotate-90' : ''}`} /></button>
        {showPlan && <div className="mt-4 space-y-2">{(mission.steps ?? []).slice(0, 4).map((step: any) => <div key={step.id} className="flex items-center gap-3 text-xs"><span className={`flex h-5 w-5 items-center justify-center border ${step.status === 'complete' ? 'border-[#3e604e] bg-[#1c3025] text-[#91c7a0]' : step.status === 'active' ? 'border-[#743832] bg-[#351d1c] text-[#ed9d8e]' : 'border-[#393d46] text-[#626873]'}`}>{step.status === 'complete' ? <Check size={11} /> : step.status === 'active' ? <span className="h-1.5 w-1.5 rounded-full bg-[#e05449] pulse-red" /> : <Circle size={8} />}</span><span className={step.status === 'queued' ? 'text-[#686e79]' : 'text-[#c8c3bb]'}>{step.label}</span><span className="mono ml-auto text-[9px] uppercase text-[#666c77]">{step.status}</span></div>)}</div>}
      </div>
      {onView && <button onClick={onView} className="mt-5 flex items-center gap-1 text-[11px] font-medium text-[#d9897d] hover:text-[#f0b3a8]" data-testid="button-view-active-mission">Inspect mission <ChevronRight size={13} /></button>}
    </div>
  );
}

function ActivityFeed({ activities, loading }: { activities?: any[]; loading: boolean }) {
  const iconFor = (type: string) => type === 'code' ? FileCode2 : type === 'image' ? Sparkles : type === 'video' ? Film : type === 'mission' ? Terminal : Server;
  if (loading) return <div className="panel p-5 space-y-5">{[1, 2, 3, 4].map((item) => <div className="flex gap-3" key={item}><Skeleton className="h-7 w-7" /><div className="flex-1"><Skeleton className="h-3 w-1/2" /><Skeleton className="mt-2 h-3 w-4/5" /></div></div>)}</div>;
  if (!activities?.length) return <div className="panel flex min-h-[230px] items-center justify-center p-6 text-center"><div><ActivityIcon size={20} className="mx-auto mb-3 text-[#6e737d]" /><p className="text-sm text-[#c9c3bb]">No activity recorded</p><p className="mt-1 text-xs text-[#707680]">DEVIL will publish its first signal here.</p></div></div>;
  return <div className="panel divide-y divide-[#292c34]">{activities.slice(0, 6).map((activity: any) => { const Icon = iconFor(activity.type); return <div className="group flex gap-3 p-4 transition-colors hover:bg-[#1b1d23]" key={activity.id} data-testid={`activity-${activity.id}`}><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[#373a43] bg-[#1a1c22] text-[#a6a0a0] group-hover:border-[#71332f] group-hover:text-[#df8074]"><Icon size={13} /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="truncate text-xs font-medium text-[#d8d2ca]">{activity.title}</p><span className="mono shrink-0 text-[9px] text-[#626873]">{timeAgo(activity.timestamp)}</span></div><p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#767c86]">{activity.detail}</p></div></div>; })}</div>;
}

function Home() {
  const [, setLocation] = useLocation();
  const dashboardQuery = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const activityQuery = useListActivity({ query: { queryKey: getListActivityQueryKey() } });
  const missionsQuery = useListMissions({ query: { queryKey: getListMissionsQueryKey() } });
  const [createdMissionId, setCreatedMissionId] = useState<string>();
  const activeMission = useMemo(() => (missionsQuery.data ?? []).find((mission: any) => mission.status !== 'complete'), [missionsQuery.data]);
  const latestMission = missionsQuery.data?.[0];
  const focusId = createdMissionId ?? activeMission?.id ?? latestMission?.id ?? '';
  const missionQuery = useGetMission(focusId, { query: { enabled: Boolean(focusId), queryKey: getGetMissionQueryKey(focusId), refetchInterval: createdMissionId ? 1500 : false } });
  const mission = createdMissionId ? missionQuery.data : activeMission ?? latestMission;
  return (
    <Shell>
      <div className="enter-up">
        <SectionHeading eyebrow="Mission control / 01" title="Make the impossible operational." detail="Issue an objective. DEVIL decomposes the work, deploys its capabilities, and returns with the outcome." action={<div className="hidden items-center gap-2 md:flex"><span className="mono text-[9px] uppercase tracking-[.16em] text-[#656b76]">Signal integrity</span><span className="h-1.5 w-1.5 rounded-full bg-[#77a987]" /><span className="mono text-[10px] text-[#8db59d]">100%</span></div>} />
        <MissionComposer onCreated={(id) => setCreatedMissionId(id)} />
      </div>
      <div className="enter-up-2 mt-7"><SystemOverview dashboard={dashboardQuery.data} loading={dashboardQuery.isLoading} /></div>
      <div className="mt-7"><ChatPanel /></div>
      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]">
        <div className="enter-up-3 space-y-7">
          {missionsQuery.isError ? <QueryError label="active missions" retry={() => missionsQuery.refetch()} /> : <MissionProgress mission={mission} loading={missionsQuery.isLoading || Boolean(createdMissionId && missionQuery.isLoading)} onView={mission ? () => setLocation(`/missions?mission=${mission.id}`) : undefined} />}
          <div className="grid gap-4 sm:grid-cols-3">
            {[{ label: 'Tasks completed', value: dashboardQuery.data?.tasksCompleted ?? '—', icon: Check }, { label: 'Files processed', value: dashboardQuery.data?.filesProcessed ?? '—', icon: FileCode2 }, { label: 'Thoughts / second', value: dashboardQuery.data?.thoughtsPerSecond ?? '—', icon: BrainCircuit }].map(({ label, value, icon: Icon }) => <div className="panel panel-hover p-4" key={label} data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={15} className="text-[#b66e61]" /><p className="mono mt-5 text-[20px] tracking-[-.04em] text-[#e6dfd7]">{value}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#686e79]">{label}</p></div>)}
          </div>
        </div>
        <div className="enter-up-3">
          <div className="mb-3 flex items-center justify-between"><p className="mono text-[10px] uppercase tracking-[.18em] text-[#828792]">Activity stream</p><Link href="/missions" className="flex items-center gap-1 text-[10px] text-[#bc756b] hover:text-[#ebaaa0]" data-testid="link-view-history">View history <ArrowUpRight size={12} /></Link></div>
          {activityQuery.isError ? <QueryError label="activity" retry={() => activityQuery.refetch()} /> : <ActivityFeed activities={activityQuery.data} loading={activityQuery.isLoading} />}
        </div>
      </div>
    </Shell>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/architect" component={Architect} />
        <Route path="/missions" component={Missions} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function Missions() {
  const [location, setLocation] = useLocation();
  const missionParam = new URLSearchParams(location.split('?')[1] ?? '').get('mission') ?? '';
  const missionsQuery = useListMissions({ query: { queryKey: getListMissionsQueryKey() } });
  const [selectedId, setSelectedId] = useState(missionParam);
  const selected = selectedId || missionParam || missionsQuery.data?.[0]?.id || '';
  const missionQuery = useGetMission(selected, { query: { enabled: Boolean(selected), queryKey: getGetMissionQueryKey(selected) } });
  const missions = missionsQuery.data ?? [];
  return (
    <Shell>
      <SectionHeading eyebrow="Mission archive / 02" title="Every outcome leaves a trace." detail="Inspect the plans, operations, and final state of every objective issued to DEVIL." action={<button onClick={() => missionsQuery.refetch()} className="flex items-center gap-2 border border-[#343740] px-3 py-2 text-[11px] text-[#a7a3a0] transition-colors hover:border-[#75403b] hover:text-[#e5a098]" data-testid="button-refresh-missions"><RefreshCw size={13} className={missionsQuery.isFetching ? 'animate-spin' : ''} /> Refresh</button>} />
      {missionsQuery.isError ? <QueryError label="mission archive" retry={() => missionsQuery.refetch()} /> : missionsQuery.isLoading ? <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><div className="panel p-4 space-y-3">{[1, 2, 3, 4].map((item) => <Skeleton className="h-20" key={item} />)}</div><div className="panel min-h-[400px] p-6"><Skeleton className="h-5 w-2/3" /></div></div> : !missions.length ? <div className="panel flex min-h-[360px] flex-col items-center justify-center p-8 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center border border-[#49302c] bg-[#281b1b] text-[#d3594e]"><History size={19} /></div><h2 className="text-lg text-[#e2dcd4]">The archive is empty.</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-[#777d87]">No objectives have been issued yet. Return to mission control and give DEVIL a difficult one.</p><Link href="/" className="mt-5 flex items-center gap-2 bg-[#c83d36] px-4 py-2.5 text-xs font-semibold text-[#fff3ed]" data-testid="link-start-first-mission">Issue first objective <ArrowUpRight size={14} /></Link></div> : (
        <div className="grid gap-5 lg:grid-cols-[minmax(280px,.72fr)_minmax(0,1.28fr)]">
          <div className="space-y-2">
            <div className="mb-3 flex items-center justify-between"><p className="mono text-[9px] uppercase tracking-[.18em] text-[#6b717c]">{missions.length.toString().padStart(2, '0')} objectives</p><Search size={14} className="text-[#626874]" /></div>
            {missions.map((mission: any) => <button key={mission.id} onClick={() => { setSelectedId(mission.id); setLocation(`/missions?mission=${mission.id}`); }} className={`panel panel-hover block w-full p-4 text-left ${selected === mission.id ? 'border-[#75322e] bg-[#27191a]' : ''}`} data-testid={`button-select-mission-${mission.id}`}><div className="flex items-center justify-between gap-2"><StatusPill status={mission.status} /><span className="mono text-[9px] text-[#646a75]">{formatDate(mission.createdAt)}</span></div><p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-[#d7d0c7]">{mission.goal}</p><div className="mt-3 flex items-center gap-2"><div className="h-1 flex-1 bg-[#2c2e35]"><div className="h-full bg-[#b43d37]" style={{ width: `${mission.progress}%` }} /></div><span className="mono text-[9px] text-[#777d86]">{Math.round(mission.progress)}%</span></div></button>)}
          </div>
          <div>{missionQuery.isError ? <QueryError label="mission detail" retry={() => missionQuery.refetch()} /> : missionQuery.isLoading ? <div className="panel min-h-[450px] p-6"><Skeleton className="h-4 w-28" /><Skeleton className="mt-5 h-7 w-4/5" /><Skeleton className="mt-8 h-2 w-full" /></div> : <MissionDetail mission={missionQuery.data} />}</div>
        </div>
      )}
    </Shell>
  );
}

function MissionDetail({ mission }: { mission?: any }) {
  if (!mission) return null;
  const [showPlan, setShowPlan] = useState(false);
  return <div className="panel p-5 md:p-7" data-testid={`detail-mission-${mission.id}`}><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2a2d35] pb-6"><div><p className="mono text-[9px] uppercase tracking-[.18em] text-[#d14a40]">Mission dossier / {mission.id}</p><h2 className="mt-3 max-w-2xl text-[22px] leading-snug tracking-[-.03em] text-[#eee8df]">{mission.goal}</h2></div><StatusPill status={mission.status} /></div><div className="grid gap-4 border-b border-[#2a2d35] py-5 sm:grid-cols-3"><div><p className="mono text-[9px] uppercase tracking-[.15em] text-[#686e79]">Progress</p><p className="mt-2 text-lg text-[#e3dbd2]">{Math.round(mission.progress)}%</p></div><div><p className="mono text-[9px] uppercase tracking-[.15em] text-[#686e79]">Issued</p><p className="mt-2 text-sm text-[#c2bbb3]">{formatDate(mission.createdAt)}</p></div><div><p className="mono text-[9px] uppercase tracking-[.15em] text-[#686e79]">Operations</p><p className="mt-2 text-sm text-[#c2bbb3]">{mission.steps?.length ?? 0} total</p></div></div>{mission.outcome?.ready && <div className="mt-6 border border-[#355646] bg-[#14221b] p-4"><div className="flex items-center gap-3"><Check size={16} className="text-[#91c7a0]" /><div><p className="mono text-[9px] uppercase tracking-[.18em] text-[#8bc0a0]">Outcome delivered</p><p className="mt-1 text-sm text-[#e4eee7]">{mission.outcome.title}</p></div></div><p className="mt-2 text-[11px] leading-relaxed text-[#9cb1a5]">{mission.outcome.description}</p>{mission.outcome.kind === 'image' && mission.outcome.assetUrl && <><img src={mission.outcome.assetUrl} alt={mission.outcome.title} className="mt-4 aspect-video w-full object-cover" /><a href={mission.outcome.assetUrl} download className="mt-3 inline-block text-[10px] font-medium text-[#aad0b6] hover:text-white">Download result</a></>}</div>}<div className="pt-6"><button onClick={() => setShowPlan((value) => !value)} className="flex w-full items-center justify-between text-left" aria-expanded={showPlan} data-testid="button-toggle-dossier-plan"><span><span className="mono text-[10px] uppercase tracking-[.18em] text-[#828792]">{showPlan ? 'Hide execution plan' : 'Show execution plan'}</span><span className="ml-2 text-[10px] text-[#666c76]">optional transparency</span></span><ChevronRight size={14} className={`text-[#777d88] transition-transform ${showPlan ? 'rotate-90' : ''}`} /></button>{showPlan && <div className="mt-5 space-y-0">{(mission.steps ?? []).map((step: any, index: number) => <div className="relative flex gap-4 pb-5 last:pb-0" key={step.id}><div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center border border-[#3a3e47] bg-[#191b21]">{step.status === 'complete' ? <Check size={13} className="text-[#8ab99a]" /> : step.status === 'active' ? <span className="h-2 w-2 rounded-full bg-[#e05247] pulse-red" /> : <span className="mono text-[9px] text-[#747a85]">{String(index + 1).padStart(2, '0')}</span>}</div>{index < (mission.steps?.length ?? 0) - 1 && <div className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-[#30333b]" />}<div className="pt-0.5"><p className={`text-sm ${step.status === 'queued' ? 'text-[#707681]' : 'text-[#d7d0c7]'}`}>{step.label}</p><p className="mt-1 text-[11px] leading-relaxed text-[#717782]">{step.detail}</p></div><span className="mono ml-auto pt-1 text-[9px] uppercase text-[#626874]">{step.status}</span></div>)}</div>}</div></div>;
}

function Settings() {
  const dashboardQuery = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const [devilMode, setDevilMode] = useState<boolean | undefined>();
  const [saved, setSaved] = useState(false);
  const mode = devilMode ?? dashboardQuery.data?.devilMode ?? true;
  const toggleMode = () => { setDevilMode(!mode); setSaved(false); };
  const save = () => { localStorage.setItem('devil-mode', String(mode)); setSaved(true); };
  return (
    <Shell>
      <SectionHeading eyebrow="Configuration / 03" title="Tune the machine." detail="Workspace preferences shape how DEVIL approaches the work. Changes apply to this operator session." />
      <div className="grid max-w-5xl gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-5">
          <section className="panel p-5 md:p-7"><div className="flex items-start justify-between gap-4"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#d74b41]">Operating mode</p><h2 className="mt-2 text-lg text-[#e8e2da]">DEVIL mode</h2><p className="mt-2 max-w-lg text-xs leading-relaxed text-[#7c828c]">Allow autonomous planning and execution with the fewest interruptions. DEVIL still surfaces every operation for inspection.</p></div><button onClick={toggleMode} className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${mode ? 'border-[#8c3834] bg-[#8f302d]' : 'border-[#41444c] bg-[#252830]'}`} aria-label="Toggle DEVIL mode" data-testid="button-toggle-devil-mode"><span className={`absolute top-1 h-[19px] w-[19px] rounded-full bg-[#eee8df] transition-transform ${mode ? 'translate-x-[24px]' : 'translate-x-1'}`} /></button></div><div className="mt-6 flex items-center gap-2 border-t border-[#292c34] pt-4"><span className={`h-1.5 w-1.5 rounded-full ${mode ? 'bg-[#df4f45]' : 'bg-[#7a7e85]'}`} /><span className="mono text-[9px] uppercase tracking-[.14em] text-[#888d96]">{mode ? 'autonomy enabled' : 'review gate enabled'}</span></div></section>
          <section className="panel p-5 md:p-7"><div className="flex items-center gap-3"><SlidersHorizontal size={16} className="text-[#c07868]" /><div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#d74b41]">Workspace</p><h2 className="mt-2 text-lg text-[#e8e2da]">Blacksite defaults</h2></div></div><div className="mt-6 space-y-4"><label className="flex items-center justify-between gap-4 border border-[#2c2f37] bg-[#15171c] p-4"><span><span className="block text-sm text-[#d7d0c8]">Signal density</span><span className="mt-1 block text-[11px] text-[#747a84]">Show operational detail in activity stream</span></span><select className="border border-[#3a3d46] bg-[#202229] px-2 py-2 text-xs text-[#c9c2b9] outline-none focus:border-[#a43a35]" data-testid="select-signal-density"><option>High</option><option>Standard</option><option>Quiet</option></select></label><label className="flex items-center justify-between gap-4 border border-[#2c2f37] bg-[#15171c] p-4"><span><span className="block text-sm text-[#d7d0c8]">Mission confirmations</span><span className="mt-1 block text-[11px] text-[#747a84]">Require a second signal before launch</span></span><input type="checkbox" className="h-4 w-4 accent-[#c83d36]" defaultChecked data-testid="input-mission-confirmations" /></label></div></section>
          <div className="flex items-center justify-end gap-3">{saved && <span className="mono text-[10px] text-[#88b89a]" data-testid="status-settings-saved">Preferences saved</span>}<button onClick={save} className="bg-[#c83d36] px-5 py-3 text-xs font-semibold text-[#fff2ec] transition-colors hover:bg-[#df4a41]" data-testid="button-save-settings">Save preferences</button></div>
        </div>
        <aside className="space-y-5"><div className="panel p-5"><div className="flex items-center gap-2"><Server size={15} className="text-[#a79a8b]" /><p className="mono text-[10px] uppercase tracking-[.16em] text-[#838892]">System readout</p></div><div className="mt-5 space-y-4">{[{ label: 'Uptime', value: dashboardQuery.data?.uptime ?? '—' }, { label: 'AI core', value: dashboardQuery.data?.aiCore ?? '—' }, { label: 'Connections', value: dashboardQuery.data?.connections ?? '—' }].map((item) => <div className="flex items-center justify-between border-b border-[#272a32] pb-3 last:border-0 last:pb-0" key={item.label}><span className="text-xs text-[#737984]">{item.label}</span><span className="mono text-[10px] capitalize text-[#c5bdb4]">{String(item.value).replaceAll('_', ' ')}</span></div>)}</div></div><div className="border border-[#3d2a26] bg-[#211918] p-5"><div className="flex gap-3"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#d58e70]" /><div><p className="text-sm text-[#d9c4b8]">You are in control.</p><p className="mt-2 text-[11px] leading-relaxed text-[#967f77]">Every mission remains inspectable. No action is hidden behind the red.</p></div></div></div></aside>
      </div>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
