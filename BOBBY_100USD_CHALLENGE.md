# Bobby Trader — Análisis de Metacognición, Benchmarking & Plan del $100 Challenge

## 1. Estado de Metacognición del Sistema

### Qué es metacognición en un agente de trading
Metacognición = "pensar sobre cómo piensas". En un agente de trading, significa:
- **Self-awareness**: Bobby sabe su win rate, sus errores recientes, su estado emocional
- **Self-regulation**: ajusta conviction basándose en performance pasado (Safe Mode)
- **Self-monitoring**: evalúa en tiempo real si su tesis se está destruyendo
- **Self-reflection**: publica debates y puede ver si estuvo correcto o no

### Estado actual de Bobby (puntuación honesta)

| Capacidad | Nivel | Evidencia |
|-----------|-------|-----------|
| **Debate adversarial** | 8/10 | 3 agentes con incentivos opuestos, Red Team real |
| **Conviction determinística** | 7/10 | BASE_CONVICTION del backend, LLM solo ajusta ±0.15 |
| **Self-awareness** | 6/10 | Episodic memory (últimos 5 trades), Safe Mode si <50% win rate |
| **On-chain accountability** | 7/10 | Commit-reveal, pero TX broadcast aún no 100% confiable |
| **Risk management** | 5/10 | Max 20% balance, max 5x leverage, pero no hay position sizing dinámico |
| **Regime detection** | 6/10 | Volatility-aware weights, pero no detecta regime shifts en tiempo real |
| **Multi-asset intelligence** | 7/10 | 15 pipelines, crypto + stocks, pero correlación cross-asset es básica |
| **Autonomous operation** | 4/10 | Cron cada 4h existe, pero no ha corrido con dinero real autónomamente |
| **Error recovery** | 3/10 | No hay circuit breaker, no hay max drawdown stop |
| **Anti-manipulation** | 5/10 | Red Team ataca vibes, pero no hay protección contra front-running o MEV |

**Score compuesto: 5.8/10** — Bobby piensa bien pero no se protege bien.

### Desafíos críticos

1. **No hay circuit breaker**
   Si Bobby pierde 3 trades seguidos, sigue operando igual. Debería pausarse automáticamente si drawdown > 15%.

2. **Position sizing es estático**
   Siempre pone el mismo monto. Debería usar Kelly Criterion real: más capital en trades de alta conviction, menos en baja.

3. **No hay correlación cross-asset real**
   Bobby analiza BTC y NVDA por separado. No entiende que si DXY sube, ambos bajan. Necesita correlation matrix.

4. **Execution slip**
   Entre que Bobby decide y OKX ejecuta, el precio puede mover. No hay slippage protection ni retry logic.

5. **Single point of failure**
   Si OpenClaw/Claude API cae, Bobby no puede pensar. No hay fallback LLM.

### Oportunidades

1. **Track record verificable** — Nadie más tiene commit-reveal on-chain. Eso es un moat real.
2. **Multi-asset cross-correlation** — Si Bobby cruza crypto + stocks + commodities en un solo debate, es único.
3. **Vibe Trading** — Concepto de Vlad Tenev. Bobby es la primera implementación funcional.
4. **Protocol-level intelligence** — ConvictionOracle puede ser consumido por otros protocolos DeFi.
5. **Public challenge** — Un $100 challenge con tweets cada 4h genera engagement masivo.

---

## 2. Benchmarking — Quién más está haciendo esto

### Tier 1: Los grandes (>$100M market cap)

| Proyecto | MCap | Qué hace | Track record | Diferencia con Bobby |
|----------|------|----------|-------------|---------------------|
| **Virtuals Protocol** | $462M | Plataforma para lanzar AI agents con tokens | Tokens especulativos, no trading real | Bobby opera con dinero real, no tokens |
| **FET (Fetch.ai)** | $507M | Infraestructura de agentes autónomos | Framework, no trader | Bobby es un trader, no un framework |
| **AIXBT** | ~$30M (bajó) | Agente que postea alpha en Twitter | Calls públicos, win rate mixto ~45% | Bobby tiene debate adversarial + on-chain proof |

### Tier 2: Competidores directos

| Proyecto | Qué hace | Cómo se verifica | Weakness |
|----------|----------|------------------|----------|
| **Autonolas (OLAS)** | Agentes autónomos en Gnosis Chain | Wallets públicas on-chain | No tiene debate adversarial, solo ejecuta |
| **Spectral Finance** | AI agents para DeFi | On-chain execution | No tiene voice, no tiene conviction scoring |
| **Wayfinder (PRIME)** | Natural language → on-chain | TX execution visible | No tiene metacognición, solo ejecuta lo que le dices |
| **Brian.so** | NL → blockchain transactions | TX hashes | Zero intelligence, solo traduce texto a TX |

### Tier 3: Experimentos similares al $100 Challenge

| Proyecto | Budget | Duración | Resultado | Verificación |
|----------|--------|----------|-----------|-------------|
| YouTubers "ChatGPT trades $1000" | $1000 | 1-4 semanas | Resultados mixtos, -5% a +15% | Screenshots (no verificable) |
| AI Arena | Variable | Competiciones | Rankings de modelos ML | On-chain en Arbitrum |
| Numerai | Staking | Ongoing | Tournament-style | Verificable pero no real-time |

### Conclusión del benchmarking

**Nadie tiene las 5 piezas juntas:**
1. Debate adversarial con voz ✅ (solo Bobby)
2. Conviction determinística con regime-awareness ✅ (solo Bobby)
3. On-chain commit-reveal ✅ (Autonolas parcial, Bobby completo)
4. Ejecución real en CEX + DEX ✅ (solo Bobby)
5. Public track record con tweets automáticos ✅ (aixbt parcial, Bobby puede hacerlo mejor)

Bobby's moat: **la combinación de metacognición + ejecución real + accountability on-chain es única.**

---

## 3. Plan del $100 Challenge — "Bobby's 5-Day Proof"

### Concepto
Bobby recibe $100 USDT en su cuenta OKX. Durante 5 días, opera de forma autónoma con las siguientes reglas:
- Escanea cada 4 horas
- Si encuentra conviction >= 6/10, ejecuta
- Si conviction < 6/10, publica análisis pero no opera
- Cada 4 horas publica un tweet con: análisis, decisión, balance actual
- Todo queda registrado on-chain en X Layer

### Prerequisitos (48 horas antes del challenge)

#### Hora 0-8: Risk Management (CRÍTICO)

```
HARD RULES — No pueden ser overridden por el LLM:
- Max position size: 20% del balance ($20 iniciales)
- Max leverage: 5x (no 10x, no 50x)
- Max concurrent positions: 2
- Circuit breaker: si drawdown > 20% ($80 balance), Bobby se pausa 24h
- Max loss per trade: 10% del balance ($10 iniciales)
- Stop loss OBLIGATORIO en cada trade (no optional)
- Min conviction para ejecutar: 6/10 (no 5/10)
- Assets permitidos: BTC, ETH, SOL, NVDA, SPY (solo los más líquidos)
```

Implementar en `src/lib/onchainos/risk-manager.ts`:
1. `canOpenPosition()` — verifica todas las reglas antes de ejecutar
2. `getPositionSize(conviction, balance)` — Kelly Criterion simplificado
3. `checkCircuitBreaker(balance, initialBalance)` — pausa si drawdown > 20%
4. `maxConcurrentPositions()` — no más de 2 abiertas

#### Hora 8-16: Autonomous Loop Hardening

1. **bobby-cycle.ts** — verificar que el cron cada 4h funciona sin intervención
2. **Auto TP/SL** — verificar que SIEMPRE se pone stop loss
3. **Error recovery** — si OKX rechaza, no reintentar infinitamente (max 2 retries)
4. **Timeout** — si el ciclo tarda >2 min, abortar y publicar "cycle timed out"
5. **Balance check** — antes de cada trade, verificar balance real en OKX

#### Hora 16-24: Twitter Integration

1. **API de Twitter** — conectar para publicar automáticamente
2. **Tweet template**:
```
🤖 Bobby's $100 Challenge — Hour [N]

📊 Scanned 47 markets
🧠 Conviction: [X]/10 on [ASSET]
[EJECUTÓ / NO EJECUTÓ]

💰 Balance: $[XX.XX] ([+/-]X.X% desde inicio)
📈 Win rate: X/Y trades
🔗 On-chain proof: [TX hash]

#BobbyTrader #VibeTrading #OKX
```

3. **Tweet de apertura** (Hora 0):
```
🤖 Bobby's $100 Challenge STARTS NOW

I'm Bobby — an AI CIO with metacognition.
3 agents debate every trade before I execute.
Every prediction goes on-chain BEFORE the outcome.

Starting balance: $100 USDT
Duration: 5 days
Rules: Max 5x leverage, max 20% per trade, circuit breaker at -20%

You don't trust Bobby — you verify him.
🔗 Track record: [X Layer contract]

#BobbyTrader #AI #Trading
```

4. **Tweet de cierre** (Día 5):
```
🤖 Bobby's $100 Challenge — FINAL RESULTS

📊 Starting: $100.00
💰 Ending: $[XX.XX]
📈 Return: [+/-]X.X%
🏆 Win rate: X/Y trades
🧠 Avg conviction on wins: X/10
🧠 Avg conviction on losses: X/10

Every trade was committed on-chain BEFORE the outcome.
Full track record: [OKLink URL]

What I learned: [Bobby's reflection]

#BobbyTrader #VibeTrading
```

#### Hora 24-36: Testing & Dry Run

1. **Paper trading dry run** — correr el loop completo por 12h sin dinero real
2. Verificar que:
   - Cada ciclo produce un tweet legible
   - El balance se actualiza correctamente
   - Los stops se ejecutan
   - El circuit breaker funciona (simular drawdown)
   - Los tweets no tienen datos alucinados
3. **Stress test** — ¿qué pasa si OKX API cae? ¿Si Claude API cae?

#### Hora 36-48: Final Prep

1. Depositar $100 USDT en la cuenta OKX de Bobby
2. Verificar balance via API
3. Publicar tweet de apertura
4. Activar el cron
5. Bobby está solo — no intervenir salvo circuit breaker

### Timeline del Challenge

```
Día 0 (Pre): Tweet de apertura + deposit $100
Día 1: 6 cycles (cada 4h) — Bobby encuentra su ritmo
Día 2: 6 cycles — Bobby ajusta basándose en resultados
Día 3: 6 cycles — Mid-challenge tweet con reflexión
Día 4: 6 cycles — Bobby en modo conservador si está en profit
Día 5: 6 cycles — Tweet de cierre con resultados finales
Total: 30 cycles, ~10-15 trades esperados
```

### Métricas de éxito

| Métrica | Target mínimo | Target ideal |
|---------|---------------|-------------|
| Balance final | > $85 (-15%) | > $110 (+10%) |
| Win rate | > 40% | > 55% |
| Max drawdown | < 25% | < 15% |
| Trades ejecutados | 5-15 | 8-12 |
| Tweets publicados | 30 | 30 |
| On-chain commits | = trades | = trades |
| Circuit breaker triggered | 0-1 | 0 |
| System crashes | 0 | 0 |

### Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|-----------|
| Bobby pierde todo | Baja (circuit breaker) | Pausa a -20%, max 5x leverage |
| API de OKX cae | Media | Retry 2x, tweet "API down, skipping cycle" |
| Claude API cae | Baja | Fallback: tweet "brain offline" + skip cycle |
| Flash crash del mercado | Media | Stop loss obligatorio + max 5x |
| Bobby alucina un precio | Baja (arreglado) | Anti-hallucination rule in system prompt |
| Tweet con datos erróneos | Media | Template determinístico, no LLM-generated |
| Alguien front-runs Bobby's tweets | Baja ($100 es irrelevante) | N/A para este monto |

---

## 4. Lo que necesitamos implementar en 48h

### Prioridad 1 (Blocker — sin esto no arrancamos)
- [ ] Circuit breaker (drawdown > 20% = pause)
- [ ] Position sizing dinámico (Kelly simplified)
- [ ] Max 2 concurrent positions
- [ ] Stop loss obligatorio (no optional)
- [ ] Balance check pre-trade
- [ ] Min conviction 6/10 para auto-execute en challenge mode

### Prioridad 2 (Necesario para el challenge)
- [ ] Twitter API integration (post tweet cada 4h)
- [ ] Tweet template determinístico (no LLM-generated)
- [ ] Bobby-cycle hardening (timeout, retry, error recovery)
- [ ] Dry run de 12h en paper trading

### Prioridad 3 (Nice to have)
- [ ] Dashboard público del challenge (balance real-time)
- [ ] Telegram notifications a ti cuando Bobby ejecuta
- [ ] Mid-challenge reflection tweet (Día 3)
- [ ] Correlation matrix básica (BTC-NVDA-DXY)

---

*Prepared by Claude Opus 4.6 — Head of Product, Bobby Agent Trader*
*March 20, 2026*
