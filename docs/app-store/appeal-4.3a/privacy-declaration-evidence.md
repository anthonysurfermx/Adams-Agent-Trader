# Por qué "Data Not Collected" es correcto — evidencia en código

Verificado 2026-08-28 contra `ios/companion-bond` y `api/`.

## Qué llama la app iOS

`api/bobby-asset-search` · `api/voice-tool` · `api/bobby-voice-free` ·
`api/stock-candles` · `api/okx-candles` — todos en bobbyprotocol.xyz.

## Qué se guarda

| Ruta | ¿Escribe? | Evidencia |
|---|---|---|
| `bobby-asset-search?q=<frase del usuario>` | **No** | cero `insert`/`upsert`/`cache` en el archivo |
| `voice-tool` (POST) | **No** | read-only por diseño; recibe nombre de tool + símbolo, no texto libre |
| `bobby-voice-free` | **No** | texto→audio, nada persiste |
| candles | **No** | proxy de datos públicos |

**No hay cuenta, ni login, ni user ID.** Todo lo personal (companion, XP,
memoria del desk) vive en `UserDefaults` del dispositivo.

## Lo único que sí persiste: el contador de rate limit

`enforcePublicRateLimit` → `checkPersistentLimit` guarda en la tabla `api_cache`:

```
clave:  rl:<scope>:<hash>     valor: { count }     con expires_at
```

donde `<hash>` viene de [rate-limit.ts:52](../../../api/_lib/rate-limit.ts:52):

```ts
createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24)
```

IP salteada, hasheada y truncada. No se guarda la IP cruda, no se liga a
ninguna identidad (no existe identidad), expira sola, y su único uso es
prevención de abuso.

## Conclusión

No cae en ningún tipo de dato de la taxonomía de Apple: no hay Contact Info,
User Content retenido, Search History retenida, ni Identifiers ligados al
usuario. Un contador anti-abuso derivado de IP, no vinculado a identidad y
no usado para tracking, no requiere declaración.

**"Data Not Collected" queda, y ahora es consistente con
`NSPrivacyCollectedDataTypes` vacío en `PrivacyInfo.xcprivacy`.** Esa
consistencia entre manifiesto y cuestionario es lo que pedía el P0 de Kimi.

## Nota aparte: reconocimiento de voz

`SFSpeechRecognizer` corre sin `requiresOnDeviceRecognition`, así que el audio
puede llegar a servidores de Apple. Eso es procesamiento de Apple, no
recolección del desarrollador — no cambia el cuestionario, pero los docs del
Speech framework exigen avisarle al usuario. Ya está dicho en el string de
permiso, EN y ES.
