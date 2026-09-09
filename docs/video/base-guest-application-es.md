# Aplicación a Base — guión de video (ES)

**Duración objetivo:** 1:50. Ritmo hablado ~150 palabras por minuto, 255 palabras.
**Tono:** directo, sin jerga, mirando a cámara. Nada de números que no estén verificados.

---

### [0:00 – 0:12] Quién soy

Soy Anthony, desde México. Construí Bobby Protocol sobre Base.

### [0:12 – 0:35] El problema

Hoy cualquiera le pregunta a una inteligencia artificial por un activo y recibe
una respuesta segura, bien redactada, y sin consecuencias. Si se equivoca, no
pasa nada. Nadie lo anota.

Preguntarle a una IA ya no es una ventaja. La ventaja es comprobar.

### [0:35 – 1:05] Qué es Bobby

Bobby es esa capa de comprobación. Antes de que veas una respuesta, tres agentes
discuten: uno arma la tesis, otro intenta romperla, y un tercero decide. Si nada
sobrevive, el veredicto es "no hay operación". Esa es la respuesta que un modelo
que siempre responde nunca te va a dar.

Y el veredicto queda registrado antes de que el mercado lo resuelva.

### [1:05 – 1:32] Qué está vivo en Base

Siete contratos desplegados en Base, todos bajo una Safe de dos de tres. El
registro de decisiones fija el momento de entrada antes de que exista su precio,
y lo verifica contra oráculo.

Hoy hicimos el primer swap real desde el producto: un dólar de USDC a NVIDIA
tokenizada, por Uniswap V3, firmado por la wallet del usuario. Bobby nunca firma
ni custodia fondos.

### [1:32 – 1:50] Tracción y cierre

En el registro público llevamos 863 debates y 793 resueltos, con 54.5% de acierto
sobre los resueltos. Los fallos también se publican.

Y cualquier agente de IA se conecta a Bobby con un comando: once herramientas
públicas por MCP.

Base es donde esto tiene sentido. Me encantaría contarlo.

---

## Notas de grabación

- La frase que tiene que quedar es **"preguntarle a una IA ya no es una ventaja; la ventaja es comprobar"**. Si hay que cortar tiempo, se corta de la sección de tracción, nunca de esa.
- Al decir el swap, mostrar la transacción en Basescan en pantalla.
- Al decir los siete contratos, mostrar la página `/protocol/docs`.
- No decir "863 debates on-chain": los 863 viven en el registro público de resolución. On-chain el registro V2 apenas empezó. La distinción es la credibilidad del proyecto.

## Hechos verificados el 2026-09-09

| Dato | Valor | Dónde se comprueba |
|---|---|---|
| Debates en el registro público | 863 | `/api/bobby-protocol-stats` |
| Resueltos | 793 | mismo endpoint |
| Acierto sobre resueltos | 54.5% | mismo endpoint |
| Contratos en Base | 7 | todos responden `owner()` con la Safe 2 de 3 |
| Safe | `0x8BE60853F27b944e11486285d95c3e06596553b4` | Basescan |
| Primer swap real | 1 USDC → 0.00443554 NVDAc | tx `0xfaa8977480f5f77c18aa50f34dbc18f7200d5fb51b97263a21fbed9fabede670` |
| Herramientas MCP públicas | 11 | `tools/list` en `/api/mcp-bobby` |
