# Evidencia medida — Bobby vs Makai (Surf Moments)

Comparación local 2026-08-28. Fuentes:
- Bobby: rama `ios/companion-bond`, `ios/Bobby/`
- Makai: `/Users/mrrobot/Surf moments/SurfMoments` (bundle `com.surfmoments.app`,
  display name `Makai`, archives `Makai-*.xcarchive`)

## Resultado por prueba

| Prueba | Resultado |
|---|---|
| Archivos byte-idénticos | **1 de 45** — solo `Sources/Assets.xcassets/AppIcon.appiconset/Contents.json` (sha1 `9ad64526…`), boilerplate que XcodeGen genera igual en todo proyecto |
| Nombres de archivo compartidos | 5: `.gitignore`, `Contents.json`, `Theme.swift`, `icon-1024.png`, `project.yml` — todos genéricos |
| Tipos Swift con nombre compartido | **2 de 34** (Bobby) vs 125 (Makai): `Theme` y `ChatMessage`. Implementaciones distintas — el `ChatMessage` de Bobby tiene 3 campos (`fromBobby`, `text`), el de Makai 5 (`sessionID`, `senderID`, `date`) y es `Codable` |
| `Theme.swift` | 77 líneas vs 243. Cero símbolos en común más allá de `enum Theme` / `extension View` |
| Iconos 1024px | 3 hashes distintos, ninguno coincide |
| Dependencias SPM | Bobby: GLTFKit2. Makai: ninguna. **Cero solapamiento** |
| Claves de build settings | **9 de 10 / 12 compartidas** — ver abajo |

## Lo único que sí comparten: la receta de scaffolding

Ambos usan XcodeGen con `project.yml` (no un `.xcodeproj` commiteado), iOS 17.0,
Swift 5.9, layout `Sources/` plano, y estas 9 claves:

```
ASSETCATALOG_COMPILER_APPICON_NAME   GENERATE_INFOPLIST_FILE
CODE_SIGN_STYLE                      MARKETING_VERSION
CURRENT_PROJECT_VERSION              PRODUCT_BUNDLE_IDENTIFIER
DEVELOPMENT_TEAM (QZRTV6CMTT)        SWIFT_VERSION
TARGETED_DEVICE_FAMILY
```

Es el set estándar de XcodeGen más el team, que por definición es el mismo en una
sola cuenta. **No es evidencia de plantilla reempaquetada**: dos apps cualesquiera
generadas con XcodeGen por el mismo desarrollador comparten exactamente esto.

## Conclusión

Makai no explica el rechazo. El código de aplicación es 100% disjunto; lo compartido
es la configuración de proyecto, que es infraestructura, no producto.

## Nota que conecta con el P1 de Kimi

El único archivo byte-idéntico está en `ios/Bobby/Sources/Assets.xcassets/` — el
catálogo AppIcon **duplicado** que Kimi marcó como P1. El canónico
(`ios/Bobby/Assets.xcassets/`) no coincide con nada de Makai. Borrar el duplicado
resuelve el warning de build **y** elimina el único artefacto compartido. Dos por uno.
