// Two product languages. English is the default everywhere on the web; Spanish
// is an explicit choice stored in `bobby_lang` (the same key the rest of the
// web honours), switchable from the risk notice, the onboarding and the desk.
export type Lang = 'en' | 'es';

export interface Bi { en: string; es: string }

export function lang(): Lang {
  try {
    const stored = localStorage.getItem('bobby_lang');
    if (stored === 'es' || stored === 'en') return stored;
  } catch { /* private mode */ }
  return 'en';
}

export function isSpanish(): boolean { return lang() === 'es'; }

/** `t(en, es)` — the same shape as `L.t` in the iOS app. */
export function t(en: string, es: string): string { return isSpanish() ? es : en; }

/**
 * A missing entry used to throw here, and because the root route has an
 * errorElement, one absent record took the whole desk down to a 404 page.
 * Adding a companion without every id-keyed record filled in is a data gap,
 * not a reason to lose the route — so this degrades to an empty string and
 * says so in the console.
 */
export function pick(bi: Bi | null | undefined): string {
  if (!bi) {
    console.error('[i18n] pick() got no bilingual entry — a companion id is missing from an id-keyed record');
    return '';
  }
  return isSpanish() ? bi.es ?? '' : bi.en ?? '';
}

/** Language sent to the TTS endpoint. */
export function ttsLang(): Lang { return lang(); }
