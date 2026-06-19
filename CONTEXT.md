# Macetadora — Contexto para agentes

Documento de referencia para entender, modificar o extender la aplicación sin releer todo el código.

## Qué es

**Macetadora** es una calculadora web estática que estima cuántos **litros de tierra** caben en una maceta según su forma, tipo de material y dimensiones introducidas por el usuario.

- **Stack:** HTML + CSS + JavaScript vanilla + Bootstrap 5 (CDN)
- **Sin build, sin backend, sin dependencias npm**
- **Unidades:** centímetros (entrada) → litros (salida). Conversión: `cm³ / 1000`

## Estructura del proyecto

```
Macetadora/
├── index.html       # UI principal, selectores, formulario, panel de resultado
├── favicon.png      # Icono de la app (favicon + logo animado en cabecera)
├── css/
│   └── styles.css   # Estilos kawaii/minimalistas (variables CSS, animaciones)
├── js/
│   └── app.js       # Toda la lógica de cálculo y campos dinámicos
└── CONTEXT.md       # Este archivo
```

## Flujo de la aplicación

1. El usuario elige **forma del contenedor** y **tipo de maceta** (ambos obligatorios; valor por defecto: "No por defecto").
2. **Al seleccionar un tipo de maceta** (Terracota o Plasticforte), la forma se fija automáticamente en **Cono truncado** y el selector de forma queda **bloqueado** (`syncShapeLock()` en `app.js`). Los tipos actuales solo usan esa geometría.
3. Al seleccionar ambos, se renderizan campos de entrada dinámicos según la forma.
4. El botón "Calcular capacidad" permanece deshabilitado hasta que ambos selectores tienen valor.
5. Al enviar el formulario, `calculate()` en `app.js` aplica la fórmula correspondiente.
6. El resultado muestra litros formateados y un detalle con las dimensiones efectivas usadas.

## Selectores

### Forma del contenedor (`#shapeSelect`)

| Valor interno     | Etiqueta UI    | Campos de entrada                          |
|-------------------|----------------|--------------------------------------------|
| `rectangular`     | Rectangular    | longitud, anchura, profundidad             |
| `round`           | Redondo        | diámetro exterior, altura                  |
| `truncated-cone`  | Cono truncado  | diámetro superior, profundidad             |

**Bloqueo automático:** si el usuario elige Terracota o Plasticforte, este selector se fuerza a `truncated-cone` y se deshabilita. Al volver a "No por defecto" en tipo de maceta, el selector de forma se reactiva.

### Tipo de maceta (`#potTypeSelect`)

| Valor interno  | Etiqueta UI                              | Factores (en `POT_TYPES`)     |
|----------------|------------------------------------------|-------------------------------|
| `terracota`    | Macetas Terracota                        | `exteriorFactor: 0.875`, `interiorFactor: 0.63` |
| `plasticforte` | Macetas decorativas (Plasticforte)       | `exteriorFactor: 1`, `interiorFactor: 0.656`    |

Los factores están centralizados en el objeto `POT_TYPES` al inicio de `js/app.js`. **Modificar ahí** si cambian las proporciones de un tipo de maceta.

## Fórmulas de volumen

Todas las dimensiones en **cm**. Volumen en **cm³**, luego convertido a litros.

### Rectangular

```
volumen = profundidad × longitud × anchura
```

- **No aplica** ajustes de tipo de maceta (Terracota/Plasticforte).
- El tipo de maceta sigue siendo obligatorio en UI pero no altera el cálculo.

### Redondo (cilindro)

```
volumen = π × R² × altura
```

Donde `R = diámetro_interior / 2`.

**Diámetro interior** según tipo:

- **Terracota:** `interior = usuario × 0.875 × 0.63`
  - Primero se obtiene el diámetro exterior real (87,5% del nominal).
  - Luego el interior útil para tierra (63% del exterior real).
- **Plasticforte:** `interior = usuario × 0.656`
  - Sin corrección de diámetro exterior nominal.
  - Interior = 65,6% del diámetro introducido.

Funciones clave: `getInteriorDiameter()`, `calculateRound()`.

### Cono truncado

```
volumen = (1/3) × π × profundidad × (r² + r×R + R²)
```

Donde `R = diámetro_superior / 2` y `r = diámetro_inferior / 2`.

**Importante — semántica distinta al cilindro:**

En cono truncado, `interiorFactor` **no** representa el diámetro interior de relleno de tierra como en el cilindro. Representa la **proporción entre diámetro inferior y superior** de la maceta.

| Tipo         | Diámetro superior              | Diámetro inferior        |
|--------------|--------------------------------|--------------------------|
| Terracota    | `usuario × 0.875`              | `superior × 0.63`        |
| Plasticforte | `usuario` (sin ajuste)         | `superior × 0.656`       |

Funciones clave: `getConeDiameters()`, `truncatedConeVolume()`, `calculateTruncatedCone()`.

#### Bug histórico corregido

Una versión anterior aplicaba erróneamente el 63% como diámetro interior único y estimaba el inferior con un ratio inventado (`coneBottomRatio: 0.55`), dando volúmenes ~3× menores que calculadoras de referencia. La lógica correcta deriva superior e inferior como en la tabla anterior.

#### Ejemplo de validación (Terracota, cono)

- Entrada: diámetro superior nominal **70 cm**, profundidad **51,5 cm**
- Superior real: `70 × 0.875 = 61,3 cm`
- Inferior: `61,3 × 0.63 = 38,6 cm`
- Resultado esperado: **~102 L** (referencia externa con 60,9 / 38,3 cm ≈ 101 L)

## Funciones principales en `app.js`

| Función                 | Responsabilidad                                      |
|-------------------------|------------------------------------------------------|
| `syncShapeLock()`       | Fija forma en cono truncado y bloquea selector si hay tipo de maceta |
| `renderInputFields()`   | Genera HTML de inputs según forma y tipo             |
| `parsePositiveNumber()` | Lee input numérico; rechaza ≤ 0 o NaN                |
| `getInteriorDiameter()` | Cilindro: exterior real + diámetro interior          |
| `getConeDiameters()`    | Cono: diámetros superior e inferior efectivos        |
| `truncatedConeVolume()` | Fórmula del cono truncado                            |
| `calculate()`           | Dispatcher según forma seleccionada                  |
| `formatLiters()`        | Formato de salida (<1: 2 decimales, <100: 1, resto entero) |
| `cm3ToLiters()`         | Divide entre 1000                                    |

## UI y estilos

- **Bootstrap 5.3.3** vía jsDelivr CDN (grid, formularios, utilidades).
- **Fuente:** Nunito (Google Fonts).
- **Favicon / logo:** `favicon.png` en la raíz; usado como `<link rel="icon">` y como imagen dentro de `.logo-badge` (animación `float`).
- **Tema kawaii:** pasteles (rosa `#ffb7c5`, menta `#b8e8d4`), bordes redondeados, animación flotante en logo, gradientes suaves.
- Clases custom prefijadas con `kawaii-` en `styles.css`.
- Emojis como iconografía (sin librería de iconos externa).

## Cómo ejecutar / desplegar

Abrir `index.html` directamente en el navegador o servir la carpeta con cualquier servidor estático.

Para GitHub Pages: publicar la raíz del repo (contiene `index.html`).

## Puntos de extensión habituales

1. **Nuevo tipo de maceta:** añadir entrada en `POT_TYPES` y actualizar badges en `renderInputFields()`.
2. **Nueva forma:** nuevo `case` en `calculate()` y rama en `renderInputFields()`.
3. **Entrada manual de diámetro inferior (cono):** añadir campo opcional; si tiene valor, usarlo en lugar de `getConeDiameters()`.
4. **Ajustes rectangulares por tipo:** hoy no existen; implementar en `calculateRectangular()` si se requieren.
5. **Sustituir `alert()` por toast/modal** para errores de validación.

## Dependencias externas (CDN)

- `bootstrap@5.3.3` CSS + JS bundle
- Google Fonts: Nunito 400/600/700/800

No hay `package.json` ni lockfiles.

## Idioma

Interfaz y mensajes en **español**. Locale de formato numérico: `es-ES` en `formatLiters()`.
