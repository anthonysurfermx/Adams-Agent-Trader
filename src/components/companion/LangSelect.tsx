// EN / ES switch shared by the risk notice, the onboarding and the desk.
// The preference lives in `bobby_lang` (same key the rest of the web and the
// iOS app honour); a reload is the simplest way to re-render every t() call.
import { isSpanish } from '@/lib/companions/i18n';

export default function LangSelect({ className = '' }: { className?: string }) {
  return (
    <label className={`flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/50 ${className}`}>
      <span>LANG</span>
      <select
        aria-label="Language"
        value={isSpanish() ? 'es' : 'en'}
        onChange={(e) => { try { localStorage.setItem('bobby_lang', e.target.value); } catch { /* private mode */ } window.location.reload(); }}
        className="bg-transparent text-[#7da6ff] outline-none"
      >
        <option value="en">EN · US</option>
        <option value="es">ES · MX</option>
      </select>
    </label>
  );
}
