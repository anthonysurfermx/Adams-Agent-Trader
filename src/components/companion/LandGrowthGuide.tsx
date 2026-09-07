import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Sprout } from 'lucide-react';
import { t } from '@/lib/companions/i18n';
import { WORLDS_PATH } from '@/lib/trader-land/public';

type Props = {
  practice: boolean;
  available: number;
  seeds: number;
  reviewReady: number;
  route: { index: number; total: number; complete: boolean };
  nextName?: string;
  waitingUntil?: string;
  disabled: boolean;
  onReview: () => void;
  onBuild: () => void;
  onSignIn: () => void;
};

export default function LandGrowthGuide(props: Props) {
  const { practice, available, seeds, reviewReady, route, nextName, waitingUntil, disabled } = props;
  const next = practice ? t('Try building, then start your earned island.', 'Prueba construir y empieza tu isla ganada.')
    : reviewReady ? t('Review a thesis to make its seed bloom.', 'Revisa una tesis para hacer florecer su semilla.')
    : available ? t('You have pieces ready. Give them a place.', 'Tienes piezas listas. Dales un lugar.')
    : seeds ? t('Your seeds are waiting for their thesis review.', 'Tus semillas esperan la revisión de su tesis.')
    : route.complete ? t('Discovery route complete. Keep reviewing your decisions.', 'Ruta de descubrimiento completa. Sigue revisando tus decisiones.')
    : t('Complete a read at the desk to earn your next seed.', 'Completa una lectura en el desk para ganar tu próxima semilla.');
  return <section className="land-growth" aria-label={t('Grow your island', 'Haz crecer tu isla')}>
    <span className="land-eyebrow"><Sprout size={14} />{practice ? t('PRACTICE ISLAND', 'ISLA DE PRÁCTICA') : t('YOUR NEXT STEP', 'TU SIGUIENTE PASO')}</span>
    <h3>{next}</h3>
    {practice ? <p>{t('To earn pieces: read at the desk → review the thesis → build. This practice layout stays in your browser, separate from your earned island.', 'Para ganar piezas: lee en el desk → revisa la tesis → construye. Esta práctica se guarda en tu navegador, separada de tu isla ganada.')}</p> : <>
      <p>{available} {t('ready to build', 'listas para construir')} · {seeds} {t('seeds', 'semillas')}</p>
      {route.total > 0 && <><label className="land-route-label" htmlFor="land-route">{t('Discovery route', 'Ruta de descubrimiento')} <span>{Math.min(route.index, route.total)} / {route.total}</span></label><progress id="land-route" max={route.total} value={Math.min(route.index, route.total)} /></>}
      {nextName && !route.complete && <p>{t('Next discovery', 'Próximo descubrimiento')}: <strong>{nextName}</strong></p>}
      {seeds > 0 && !reviewReady && waitingUntil && <p>{t('Next review', 'Próxima revisión')}: {waitingUntil}</p>}
      {route.complete && <p>{t('The route has no more pieces to award. Pending seeds can still bloom.', 'La ruta ya no entrega más piezas. Las semillas pendientes aún pueden florecer.')}</p>}
    </>}
    {practice ? <button className="land-text-link" disabled={disabled} onClick={props.onSignIn}>{t('Start my earned island', 'Empezar mi isla ganada')} →</button>
      : reviewReady ? <button className="land-text-link" disabled={disabled} onClick={props.onReview}>{t('Review thesis', 'Revisar tesis')} →</button>
      : available ? <button className="land-text-link" disabled={disabled} onClick={props.onBuild}>{t('Place a ready piece', 'Colocar una pieza lista')} →</button>
      : <Link className="land-text-link" to="/desk">{t('Go to the desk', 'Ir al desk')} →</Link>}
    <details>
      <summary>{t('How does my land grow?', '¿Cómo crece mi land?')}</summary>
      <ol>
        <li>{t('Complete a read in the desk: it plants a seed while your discovery route has pieces left.', 'Completa una lectura en el desk: planta una semilla mientras queden piezas en tu ruta.')}</li>
        <li>{t('Return when its review is ready. Review the thesis to bloom the seed, whatever the outcome. A respected no-trade also earns a ready piece along the route.', 'Vuelve cuando su revisión esté lista. Revisa la tesis para hacer florecer la semilla, sea cual sea el resultado. Un no-trade respetado también gana una pieza lista dentro de la ruta.')}</li>
        <li>{t('Place your bloomed pieces, arrange your island and share it when you are ready.', 'Coloca tus piezas florecidas, diseña tu isla y compártela cuando quieras.')}</li>
      </ol>
      <p>{t('Growth means a richer collection on an 8 × 8 island. Moving pieces or visiting islands does not award XP or expand the map.', 'Crecer significa enriquecer tu colección en una isla de 8 × 8. Mover piezas o visitar islas no da XP ni amplía el mapa.')}</p>
    </details>
    <Link className="land-discover-link" to={`${WORLDS_PATH}#comunidad`}><Globe size={16} /><span>{t('Get ideas from other islands', 'Inspírate en otras islas')} →</span></Link>
  </section>;
}
