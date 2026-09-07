# Reply to App Review — 4.3(a) Design: Spam
App 6804460489 · Submission 44079866-1bde-4290-882d-e9aae04dfb47

> ⚠️ NO ENVIADO. Anthony debe confirmar los 3 puntos marcados 🔴 antes de mandarlo.

---

Thank you for the review. We have revised the app name, subtitle, description and
keywords, and we would like to address the 4.3(a) factors directly — we believe the
app is being matched against the generic AI-assistant category rather than assessed
on what it actually does.

**Addressing the four factors listed in the rejection:**

1. *Same source code or assets as other apps already on the App Store.*
   Bobby's iOS client and its backend are first-party code written by our team. We
   are glad to give App Review read access to the repository with its full commit
   history, or to walk an engineer through it on a call.

2. *Multiple similar apps using a repackaged app template.*
   Bobby was not built from an app template. It is a native SwiftUI app with its own
   navigation, companion system, voice interaction, market views, debate engine and
   risk gate, written for this product.

3. *Purchasing an app template with problematic code from a third party.*
   No template was purchased or used.

4. *Several similar apps across multiple accounts.*
   We operate a single developer account and have never used another. The other apps
   on this account are in unrelated categories (fitness, legal services, a pet app, a
   surf app) and share neither concept nor functionality with Bobby. For completeness,
   we compared Bobby directly with our surf app, Makai: their executables, source,
   assets, dependencies, linked frameworks and product functionality are independent.

**What makes the app distinct, concretely:**

Bobby is not a single-model chat assistant. Each question is routed to three
separately-prompted agents that are required to argue opposing positions — one builds
the opportunity case, one attacks it, and a third rules on both — and then through a
risk gate that can veto the verdict outright. The user is shown the disagreement, not
a single generated reply. In a large share of sessions the outcome is an explicit
"NO TRADE", which is the opposite of what engagement-optimised assistant apps produce.

Separately, Bobby publishes its public market calls to an on-chain registry on Base
mainnet (chain 8453), using contracts we wrote and deployed ourselves. Individual
user queries are read-only and do not create a personal on-chain receipt:

    TrackRecord        0x822DB0DbbCAB398e610fcBA86DA9BB92d2493321
    ConvictionOracle   0x27f51D711171c830dd796D4B03914a8C6c46D75e
    AgentRegistry      0xB3137D7afE26fbdBcAA95573C7A20be896efde93

Contract ownership is held by a 2-of-3 Safe multisig. Anyone can inspect the published
call history on Basescan and grade Bobby against its past public calls. This public
accountability layer is part of the product, not a claim that every private query is
written on-chain.

**Changes made in this resubmission:**

- App name changed from "Bobby- Financial AI Assistant" to "Bobby: The Market Argues
  Back", removing the generic AI-assistant framing.
- Subtitle now states what the app actually does: "Most days, it says no trade."
- Description leads with the three-agent debate and the public on-chain record.
- Keywords no longer target the generic "AI companion" cluster.
- Screenshots replaced with real app states that show a NO TRADE risk-gate verdict,
  live market context, and the voice-or-text market desk. The marketing-style frames
  that did not show the app running have been removed.

**One request, so we can address the right thing:**

Could you please clarify whether the similarity was detected in the binary, the
metadata, the assets, or the app concept? We have made the metadata changes above on
the assumption that the match was at the concept and presentation level, but if the
detection was on the binary or assets we would like to investigate that specifically
rather than guess.

We would also welcome a call with App Review if it would help to demonstrate the
debate flow and the on-chain record live.

Thank you for reconsidering.

---

## 🔴 Estado — NO ENVIAR TODAVÍA

Auditoría Kimi K3 (2026-08-28): **CONDITIONAL GO**. Bloqueadores abiertos:

**P0 — privacidad (bloquea 5.1.1/5.1.2, no 4.3)**
- [ ] Link a Privacy Policy DENTRO de la app, no solo en App Store Connect
- [ ] `PrivacyInfo.xcprivacy` con razón aprobada para `UserDefaults`
- [ ] Permisos de micrófono/voz localizados EN + ES (hoy solo ES)
- [ ] Cuestionario App Privacy alineado con lo que de verdad se envía al proveedor de IA

**P0 — capturas en inglés con locale español**
- [ ] `Locale(identifier: "es_MX")` hardcodeado en `ChartView.swift` → locale del device
- [ ] Auditar strings visibles (ej. `ALCISTA` apareciendo en modo inglés)
- [ ] Recapturar TODO en inglés después del fix. `final-v4` no se sube como está
- [ ] Una de las 3 primeras capturas debe mostrar el desacuerdo Alpha/Red/CIO

**P1**
- [ ] Borrar `ios/Bobby/Sources/Assets.xcassets/`, conservar
  `ios/Bobby/Assets.xcassets/` y generar un archive limpio. Además del warning, esto
  elimina el único archivo byte-idéntico con Makai: un `Contents.json` genérico

**Resuelto**
- ✅ Cuenta única confirmada por Anthony
- ✅ Makai/Surf Moments localizado y comparado con Bobby: ejecutables, código, assets,
  dependencias, frameworks, entitlements y funcionalidad independientes
- ✅ 7 láminas lifestyle borradas de App Store Connect (quedan 3 con UI real)
- ✅ Afirmación on-chain corregida en descripción, promo text, review notes y este appeal
- ✅ Contratos Base y Safe 2-de-3 verificados en cadena

**Sobre Makai:** su proyecto interno se llama Surf Moments y está en
`/Users/mrrobot/Surf moments/SurfMoments`. Se comparó el archive 0.5.0 (34) con Bobby
1.0 (1): hashes de ejecutable, `Assets.car` e iconos distintos; cero archivos Swift
idénticos y ningún par sospechosamente parecido; frameworks, entitlements, recursos y
funciones diferentes. El único archivo byte-idéntico entre los árboles comparados es
un `AppIcon.appiconset/Contents.json` estándar dentro del catálogo duplicado de Bobby,
no código ni un recurso de producto. Es seguro decir que Bobby y Makai son productos
independientes. No extender esa conclusión a todas las apps de terceros ni afirmar que
conocemos la señal interna de Apple.
