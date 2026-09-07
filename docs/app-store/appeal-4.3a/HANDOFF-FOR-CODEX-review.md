# Handoff para Codex — revisión final antes de subir

Fecha: 2026-08-28. **Nada enviado, nada pusheado.**

## Dónde vive el trabajo

Worktree: `/private/tmp/bobby-ios-fix` · rama `ios/companion-bond` · árbol limpio.
Tres commits locales sobre `origin/ios/companion-bond`:

```
66fdf92 fix(ios): disclose Apple speech processing in the permission string
6c8f016 fix(ios): localize the three-agent card roles
ddfcd0a fix(ios): privacy manifest, EN/ES permission strings, locale and AppIcon dedup
```

10 archivos, +45 / −21.

## Qué se arregló, contra el P0/P1 de Kimi

| Item Kimi | Cambio | Cómo lo verifiqué |
|---|---|---|
| P0 privacy manifest | `Sources/PrivacyInfo.xcprivacy`, `UserDefaults` bajo `CA92.1`, sin tracking, `NSPrivacyCollectedDataTypes` vacío | `plutil -lint` OK y presente en `Bobby.app` del build |
| P0 permisos solo en español | base EN en `project.yml` + `es.lproj/InfoPlist.strings`; `developmentLanguage: en` | `plutil -extract` sobre el `Info.plist` del bundle y ambos `.lproj` |
| P0 locale `es_MX` | `ChartView.swift:276,283` ahora `L.isSpanish ? "es_MX" : "en_US"` | captura real muestra `28 AUG · 14:00` en inglés |
| P0 link privacy in-app | `Link` en el pacto de onboarding → `/privacy` (200) | leído en contexto; compila |
| P1 AppIcon duplicado | `git rm -r Sources/Assets.xcassets` (el canónico es `Assets.xcassets`) | `BUILD SUCCEEDED` sin warning de AppIcon |
| P0 cuestionario App Privacy | **sin cambio — ya era correcto** | evidencia en `privacy-declaration-evidence.md` |

## Hallazgos míos que no estaban en el reporte de Kimi

1. **`ContentView.swift:861-863`** — las tarjetas ALPHA / RED TEAM / CIO tenían los
   roles hardcodeados en español (`busca` / `ataca` / `decide`). La pantalla más
   diferenciadora de Bobby salía en español en el storefront inglés. Ahora en `L.t()`.
2. **`SFSpeechRecognizer` sin `requiresOnDeviceRecognition`** — el audio puede ir a
   servidores de Apple y el permiso no lo decía. Preferí declararlo en el string
   antes que forzar on-device, que degradaría el reconocimiento de nombres de activos.
   **Si Codex opina lo contrario, es una decisión discutible — revísala.**

## Qué quiero que revises específicamente

1. **`PrivacyInfo.xcprivacy`** — ¿`CA92.1` es la razón correcta para el uso real de
   `UserDefaults`? Los usos están en `DeskMemory.swift`, `Companion.swift`,
   `AgentProfile.swift`, `SpeechInput.swift` (cache de vocabulario).
2. **La decisión de `requiresOnDeviceRecognition`** (punto 2 arriba).
3. **`Data Not Collected`** — mi razonamiento está en `privacy-declaration-evidence.md`.
   El punto discutible es el contador de rate limit: hash salteado de IP en `api_cache`
   con expiración. Yo digo que no requiere declaración. Contrasta.
4. **Link de privacidad solo en onboarding** — corre una vez. ¿Suficiente para 5.1.1,
   o hace falta un punto siempre alcanzable? No lo puse en otro lado porque no podía
   verificar layout en vistas de 700 líneas sin romper nada.
5. **Que no rompí nada** — el build pasa, pero solo corrí un UI test
   (`test02_VerdictAndEvolution`). Los otros dos (`test01`, `test03`) no los ejecuté.

## Estado en App Store Connect

Metadata ya guardada y verificada tras recarga:
- Nombre `Bobby: The Market Argues Back` · subtítulo `Most days, it says no trade.`
- Descripción, promo y review notes con la afirmación on-chain **corregida**
  (llamadas públicas sí, query individual del usuario no)
- 3 capturas con UI real; las 7 láminas lifestyle borradas
- App Privacy: `Data Not Collected`, policy URL puesta

**Bloqueador:** la versión tiene atado el **build 5**, el rechazado. Ninguno de estos
fixes llega a Apple hasta que se archive y suba un build nuevo con el certificado de
distribución de Anthony.

## Capturas

`docs/app-store/final-v5-verified/` — generadas del build arreglado, 1320×2868 (6.9").
El slot actual del listing es 6.5". **Falta** una captura del debate en curso
(tarjetas ALPHA/RED/CIO); es estado transitorio y el test captura al terminar.

## Reglas

No enviar, no publicar, no commitear a `main`, no hacer push sin aprobación de Anthony.
