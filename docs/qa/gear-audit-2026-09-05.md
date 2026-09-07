# Auditoría del equipo (gear) del companion · 2026-09-05

Alcance: los 30 items (3 por companion) y las 10 mascotas del catálogo
"POR CONSEGUIR" en https://bobbyprotocol.xyz/agentic-world/bobby, revisados
en el preview "LO LLEVA X" (web 1280 px y móvil 375 px) y contra el código de
`main` (`src/lib/companions/data.ts`, `src/components/kinetic/mascot3d/MascotScene.ts`,
`src/components/companion/CompanionOverlays.tsx`).

Criterios pedidos por Anthony: (1) que no sean círculos genéricos, (2) que sean
3D de la misma calidad que el resto del diseño y no íconos, (3) congruencia,
simetría y colocación correcta sobre el personaje, web y celular.

## Resumen

| Estado | Items | Mascotas |
| --- | --- | --- |
| Arte 3D real (PNG 512 con alpha, render Higgsfield) | 12 (Bobby, Byte, Kora, Zip) | 4 (panda, perro, gata, mono) |
| Disco con glifo / emoji (el "círculo") | 18 (Glitch, Momo, Flux, Rook, Halo, Axiom) | 6 |

- Los 18 items sin arte se dibujan con `glyphSprite()` (`data.ts`): un canvas con
  un círculo tintado y un carácter Unicode encima. Eso es lo que se ve como
  círculo morado, azul o dorado. `TOOL_ART_AVAILABLE` solo incluye a los
  cuatro starters.
- Los 12 con arte sí son 3D de calidad consistente (materiales negro/verde/oro,
  fondo transparente, 512×512). Ver `gear_art_montage.png` en el scratch de la
  sesión o `public/tools/`.
- Colocación: en 5 companions la pieza "SOBRE LA CABEZA" sale parcialmente del
  encuadre del preview de 300 px (Momo, Flux, Rook, Halo, Axiom: entre 25 % y
  50 % del item cortado arriba). Bobby y Zip la muestran completa.
- Byte · Gafas anti-humo: el PNG está renderizado en 3/4 y se pega como plano
  frontal sobre el visor, por eso se ven torcidas y corridas. Es el caso que
  Anthony señaló.
- Kora · Auriculares radar: casi no se ven. La diadema queda detrás de la
  cabeza del gato (profundidad `0.64·R` con `depthTest` activo); solo asoma el
  auricular derecho a la altura del cuello.

## Item por item (web, preview 300 px)

Leyenda: ARTE = PNG real / GLIFO = disco con carácter. OK = se ve bien.
RECORTE = la pieza sale del encuadre. FLOTA = separada del cuerpo.

| Companion | Tier | Item | Slot | Arte | Resultado |
| --- | --- | --- | --- | --- | --- |
| Bobby | 1 | Cronómetro de paciencia | mano | ARTE | OK, pequeño, queda pegado al anillo |
| Bobby | 2 | Brújula de tendencia 4H | pecho | ARTE | OK |
| Bobby | 3 | Núcleo Omega | cabeza | ARTE | OK, flota sobre el orbe (aceptable para "sobre la cabeza") |
| Byte | 1 | Traductor de mercado | cadera | ARTE | OK |
| Byte | 2 | Gafas anti-humo | cara | ARTE | MAL: arte en 3/4 sobre cara frontal, se ve torcida y corrida a la derecha |
| Byte | 3 | Códice dorado | mano | ARTE | OK |
| Kora | 1 | Auriculares radar | orejas | ARTE | MAL: la diadema queda detrás de la cabeza, solo asoma el auricular derecho junto al cuello |
| Kora | 2 | Antena de chisme | hombro | ARTE | OK pero muy pequeña (0.28·R) |
| Kora | 3 | Micrófono dorado | mano | ARTE | OK, pequeño |
| Zip | 1 | Cronómetro 15M | mano | ARTE | OK, la mejor colocación del set |
| Zip | 2 | Baliza de alertas | hombro | ARTE | OK |
| Zip | 3 | Rayo dorado | cabeza | ARTE | OK, pegado al borde superior del canvas |
| Glitch | 1 | Martillo de tesis | mano | GLIFO | círculo morado ⚒, FLOTA |
| Glitch | 2 | Hoja de refutación | mano | GLIFO | círculo morado ✕, FLOTA |
| Glitch | 3 | Contra dorada | pecho | GLIFO | círculo dorado ◐ tapando el pecho |
| Momo | 1 | Mapa de exploración | mano | GLIFO | círculo morado ▦, FLOTA |
| Momo | 2 | Binoculares de largo alcance | cara | GLIFO | círculo morado ◫ tapando los ojos |
| Momo | 3 | Lente dorado | cabeza | GLIFO | RECORTE parcial: la mitad superior del disco sale del canvas |
| Flux | 1 | Diapasón | mano | GLIFO | círculo azul ∿, FLOTA |
| Flux | 2 | Partitura de señales | pecho | GLIFO | círculo azul ≋ (tu captura) |
| Flux | 3 | Nota dorada | cabeza | GLIFO | RECORTE parcial (~30 % arriba), disco dorado ♫ |
| Rook | 1 | Tablero de tesis | pecho | GLIFO | círculo verde ▩ sobre el emblema del pecho |
| Rook | 2 | Corona de torre | cabeza | GLIFO | RECORTE parcial (~40 % arriba), disco verde ♜ |
| Rook | 3 | Tablero dorado | mano | GLIFO | círculo dorado ♛, FLOTA |
| Halo | 1 | Escudo de capital | pecho | GLIFO | círculo azul ◇ en el centro del aro |
| Halo | 2 | Puerta de riesgo | hombro | GLIFO | círculo azul ◈ en el borde izquierdo |
| Halo | 3 | Halo dorado | cabeza | GLIFO | RECORTE parcial (~40 % arriba), disco dorado ◆ |
| Axiom | 1 | Libro mayor | mano | GLIFO | círculo dorado ≡, FLOTA |
| Axiom | 2 | Eslabón | pecho | GLIFO | círculo dorado ⛓ tapando la cara del monolito |
| Axiom | 3 | Sello dorado | cabeza | GLIFO | RECORTE parcial (~25 % arriba), disco dorado ✪ |

Mascotas: panda, perro, gata y mono tienen arte y se colocan bien a los pies.
Geco, pulpo, loro, búho, paloma y tortuga son un emoji sobre un disco.

## Causas raíz

1. **Arte faltante.** `toolHasArt()` devuelve `false` para 6 companions y el
   catálogo, el preview y el desk caen a `glyphSprite(glyph, tint)`. No es un
   bug de render: nunca se generaron esos 18 PNG ni las 6 mascotas.
2. **Encuadre del slot "cabeza".** El modelo se normaliza a 2.2 unidades y la
   cámara (fov 38°, z 4.4) encuadra justo el cuerpo. El ancla `head` está en
   `y = 0.96–1.22·R` (R = 1.1), es decir en el borde superior del modelo. En
   Bobby y Zip cabe; en Momo, Flux, Rook, Halo y Axiom el item asoma por
   encima del canvas y se corta entre un cuarto y la mitad. Mismo encuadre en
   el desk (260/340 px).
3. **Gafas de Byte.** El PNG `tool_byte_2.png` está renderizado en perspectiva
   3/4; al pegarlo como `PlaneGeometry` frontal sobre el visor se lee torcido.
   Además el perfil `byte.face` (`z = 0.92·R`, tamaño `0.62·R`) lo deja un poco
   grande y alto.
4. **Auriculares de Kora.** El perfil `kora.headset` usa `z = 0.64·R`; la cabeza
   del gato llega más adelante y el plano queda detrás de la malla. Con
   `depthTest` activo solo se dibuja lo que sobresale por el lado.
5. **Items en mano de Glitch/Momo/Flux/Rook/Axiom flotan** porque el ancla
   `hand` está calibrada para brazos humanoides; en cuerpos sin brazos visibles
   la pieza queda al aire al lado del cuerpo.

## Plan de fix propuesto (en orden)

1. Generar los 18 items y las 6 mascotas con Higgsfield en el mismo estilo que
   los 16 existentes (render 3D, fondo transparente, negro + color del
   companion, dorado para tier 3). Costo aproximado: 24 imágenes × 2 cr ≈ 50 cr,
   más `remove_background`. Después agregar los seis ids a `TOOL_ART_AVAILABLE`
   y `PET_ART_AVAILABLE`.
2. Regenerar `tool_byte_2.png` en vista frontal simétrica (gafas vistas de
   frente) y bajar el perfil `byte.face` a `y ≈ 0.40·R`, tamaño `0.52·R`.
3. Mover `kora.headset` a `z ≈ 0.84·R` o renderizar el gear con
   `depthTest: false` y `renderOrder` alto (ya se usa para el brillo).
4. Slot cabeza: bajar el ancla a `y ≈ 0.86–0.92·R` (sobre la coronilla, no
   flotando) y, en el preview, subir la cámara o reducir el modelo un 12 % cuando
   haya un item `head`. Verificar los 7 companions afectados.
5. Recalibrar `hand` para los cinco cuerpos no humanoides una vez que exista el
   arte real (el disco actual engaña al calibrar).
6. Revisar la carga del GLB en el desk en carga fresca (ver nota abajo).

## Nota sobre el desk en escritorio (carga fresca)

En el navegador embebido de la sesión (WebKit), con viewport de escritorio y
progreso guardado, el desk se quedó en el blob procedural (placeholder de
`MascotScene` mientras llega el GLB) para Byte, Bobby y Zip, aunque `zip.glb`
y el decoder Draco respondieron 200 y sin errores en consola. En viewport móvil
el mismo desk sí mostró el GLB de Byte con todo el equipo puesto, y los previews
del catálogo renderizaron los GLB en ambos tamaños. Puede ser una limitación del
navegador embebido; conviene reproducirlo en Safari y Chrome de escritorio. Si
se reproduce, revisar `lookVersion` en `MascotScene.setLook` (una segunda
llamada descarta la carga en vuelo).

## Móvil (375 px)

- Desk con Byte a 500 XP: GLB cargado, traductor en la cadera, gafas en la cara,
  códice en la mano y Bit el perro a los pies. Las gafas se ven igual de
  torcidas que en escritorio (mismo PNG, mismo ancla).
- Preview (bottom sheet, canvas 300 px): mismos resultados que en web para
  Martillo de tesis (disco), Auriculares radar (detrás de la cabeza), Lente
  dorado, Nota dorada, Corona de torre, Halo dorado y Sello dorado (recorte
  parcial arriba), Núcleo Omega y Rayo dorado (completos).
- Conclusión: los tres problemas (arte faltante, encuadre del slot cabeza y
  gafas de Byte) son independientes del tamaño de pantalla porque el canvas del
  preview mide 300 px en ambos y las anclas son unidades del modelo.

## Evidencia

Capturas tomadas en sesión (no versionadas): preview de los 30 items en web y
de 11 en móvil, más el desk móvil con Byte equipado. Los PNG existentes están
en `public/tools/` y `public/pets/`.

## Fix aplicado (rama `feat/gear-art-wave`, worktree `.claude/worktrees/gear-art`)

Fecha: 2026-09-05. Costo Higgsfield: 27 renders nano_banana_pro (25 + 2
regeneraciones) y 4 recortes de fondo, ~69 créditos en total; el resto de los
fondos se quitaron localmente (fondo plano #DDDDDD + flood fill).

1. **Arte nuevo (25 PNG, 512×512, alpha)** en `public/tools/` y `public/pets/`:
   los 18 items de Glitch, Momo, Flux, Rook, Halo y Axiom, sus 6 mascotas, y
   `tool_byte_2.png` regenerado en vista frontal simétrica. Referencias de estilo:
   gafas de Byte, Núcleo Omega, Baliza de Zip y el panda. La "Hoja de refutación"
   se rediseñó como espátula de vidrio ahumado (la primera versión salió como
   cuchillo; la biblia prohíbe armas).
2. `src/lib/companions/data.ts`: `TOOL_ART_AVAILABLE` y `PET_ART_AVAILABLE`
   incluyen a los diez companions. `glyphSprite` queda como fallback.
3. `src/components/kinetic/mascot3d/MascotScene.ts`:
   - el equipo se dibuja con `depthTest: false`, así la pieza "sobre la cabeza"
     y la diadema de Kora ya no quedan detrás de la malla;
   - perfiles `head` de Momo, Halo, Axiom y Rook subidos a `y 1.06–1.10·R`,
     `z 0.30·R`;
   - `kora.headset` a `y 0.64·R, z 0.72·R, tamaño 0.70·R`;
   - `hand` en Glitch, Momo, Flux, Rook y Axiom más cerca del cuerpo
     (`x 0.50–0.54·R`) y entre 0.40 y 0.44·R de tamaño.
4. Verificado en el dev server del worktree con `?skinQa=<id>` (móvil 375 px y
   escritorio) para los diez companions.

Pendiente: replicar los perfiles en iOS (`MascotGalleryView.swift`), que
espeja estas anclas; `npm run build` corrido antes de proponer merge.
