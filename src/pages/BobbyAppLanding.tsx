import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface DebateActivity {
  commitmentsCreated?: number;
  decisionsResolved?: number;
}

interface ProtocolStats {
  debateActivity?: DebateActivity;
}

const PAGE_TITLE = 'Bobby — Ask. Challenge. Decide.';
const DESK_URL = '/desk';

const formatNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('en-US') : '—';
};

function useProtocolStats() {
  const [stats, setStats] = useState<ProtocolStats | null>(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    void fetch('/api/bobby-protocol-stats', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as ProtocolStats;
        if (isActive) setStats(payload);
      })
      .catch(() => {
        // The landing page remains useful when the public record is unavailable.
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return stats;
}

function BrandMark() {
  return (
    <a href="/app" className="flex items-center gap-2.5 text-white" aria-label="Bobby home">
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#8fb6ff]/45 bg-[radial-gradient(circle_at_30%_20%,#c9a8ff_0%,#7c52ff_26%,#2670ff_62%,#0035b8_100%)] text-[19px] font-black tracking-[-0.12em] shadow-[0_0_28px_rgba(124,82,255,.38)]">
        B
      </span>
      <span className="text-[15px] font-extrabold tracking-[-0.045em]">Bobby</span>
    </a>
  );
}

function PhoneFrame() {
  return (
    <div className="relative mx-auto w-[min(74vw,316px)] rounded-[2.5rem] border border-white/15 bg-[#0a0a0f] p-[7px] shadow-[0_35px_120px_rgba(80,65,255,.42)]">
      <div className="pointer-events-none absolute left-1/2 top-[14px] z-10 h-[18px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
      <img
        src="/app/iphone-desk.png"
        alt="Bobby desk on iPhone"
        fetchPriority="high"
        className="w-full rounded-[2.05rem]"
      />
    </div>
  );
}

const steps = [
  ['01', 'Ask', 'Name the asset.'],
  ['02', 'Challenge', 'Risk tests the case.'],
  ['03', 'Decide', 'Read the verdict.'],
];

export default function BobbyAppLanding() {
  const stats = useProtocolStats();
  const record = stats?.debateActivity;

  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#050505] font-sans text-white antialiased">
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta
          name="description"
          content="Bobby challenges every market answer before you act."
        />
      </Helmet>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <BrandMark />
          <div className="flex items-center gap-5">
            <a
              href="/protocol"
              className="hidden font-mono text-xs uppercase tracking-[0.14em] text-white/55 transition hover:text-white sm:block"
            >
              Protocol
            </a>
            <a
              href={DESK_URL}
              className="rounded-lg bg-white px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#8e72ff] hover:text-white"
            >
              Open desk
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[calc(100svh-65px)] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:py-20">
          <div className="relative z-10 max-w-xl">
            <p className="mb-6 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a99aff]">
              Market intelligence, challenged
            </p>
            <h1 className="text-[clamp(3.6rem,9vw,7.4rem)] font-black leading-[.87] tracking-[-0.075em]">
              Ask.
              <br />
              <span className="bg-[linear-gradient(110deg,#fafafa_10%,#9d8bff_58%,#4c88ff)] bg-clip-text text-transparent">Challenge.</span>
              <br />
              Decide.
            </h1>
            <p className="mt-7 max-w-sm text-base leading-7 text-white/62">
              Bobby tests every market answer before you act.
            </p>
            <a
              href={DESK_URL}
              className="mt-9 inline-flex items-center gap-3 rounded-xl bg-[#6954ef] px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.13em] transition hover:bg-[#886fff]"
            >
              Open the desk <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-white/35">iPhone beta soon</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute inset-x-0 bottom-0 top-1/4 -z-10 rounded-full bg-[#6045ff]/20 blur-[90px]" />
            <PhoneFrame />
          </motion.div>
        </section>

        <section className="border-y border-white/10">
          <div className="mx-auto grid max-w-6xl divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {steps.map(([number, title, description]) => (
              <div key={title} className="px-5 py-7 sm:px-8">
                <p className="font-mono text-[11px] tracking-[0.14em] text-[#9b8cff]">{number}</p>
                <h2 className="mt-3 text-xl font-bold tracking-[-0.04em]">{title}</h2>
                <p className="mt-1.5 text-sm text-white/52">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="record" className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:py-28">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a99aff]">On the record</p>
            <h2 className="mt-5 max-w-md text-4xl font-black leading-[.94] tracking-[-0.065em] sm:text-5xl">
              Calls stay visible.
              <br />
              Wins and misses.
            </h2>
            <p className="mt-6 max-w-sm text-base leading-7 text-white/58">
              Bobby writes the case before the market settles it.
            </p>
          </div>

          <div className="self-end rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="font-mono text-3xl font-bold tracking-[-0.06em]">{formatNumber(record?.commitmentsCreated)}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/42">published</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-bold tracking-[-0.06em]">{formatNumber(record?.decisionsResolved)}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/42">resolved</p>
              </div>
            </div>
            <details className="mt-7 border-t border-white/10 pt-5">
              <summary className="cursor-pointer list-none font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
                What Bobby does not do
              </summary>
              <p className="mt-3 text-sm leading-6 text-white/48">
                No custody. No execution. No promises.
              </p>
            </details>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#09090d] px-5 py-20 text-center sm:px-8">
          <ShieldCheck className="mx-auto h-5 w-5 text-[#a99aff]" />
          <h2 className="mx-auto mt-5 max-w-lg text-4xl font-black leading-[.94] tracking-[-0.06em] sm:text-5xl">
            One clear answer is enough.
          </h2>
          <a
            href={DESK_URL}
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.13em] text-black transition hover:bg-[#8e72ff] hover:text-white"
          >
            Open the desk <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-5 py-7 sm:px-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-white/35">Bobby Protocol</span>
        <a href="/protocol" className="font-mono text-[10px] uppercase tracking-[0.13em] text-white/45 transition hover:text-white">Protocol</a>
      </footer>
    </div>
  );
}
