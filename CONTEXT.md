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

1. El usuario elige **forma del contenedor** y **tipo de maceta** (ambos obligatorios; placeholder: "Selecciona una opción").
2. **Al seleccionar Terracota o Plasticforte**, la forma se fija en **Cono truncado** y el selector de forma queda **bloqueado** (`syncShapeLock()` / `isBrandPot()`). Con **Maceta estándar**, el usuario elige libremente la forma.
3. Al seleccionar ambos, se renderizan campos de entrada dinámicos según forma **y** tipo.
4. El botón "Calcular capacidad" permanece deshabilitado hasta que ambos selectores tienen valor.
5. Al enviar el formulario, `calculate()` en `app.js` aplica la fórmula correspondiente.
6. El resultado muestra litros formateados y un detalle con las dimensiones efectivas usadas.

## Selectores

### Forma del contenedor (`#shapeSelect`)

Campos según forma **y** tipo de maceta (ver tabla en tipo de maceta).

| Valor interno     | Etiqueta UI    |
|-------------------|----------------|
| `rectangular`     | Rectangular    |
| `round`           | Redondo        |
| `truncated-cone`  | Cono truncado  |

**Bloqueo automático:** solo con Terracota o Plasticforte → se fuerza `truncated-cone` y se deshabilita el selector. Con Maceta estándar o placeholder, el selector permanece libre.

### Tipo de maceta (`#potTypeSelect`)

| Valor interno  | Etiqueta UI                              | Ajustes | Selector forma |
|----------------|------------------------------------------|---------|----------------|
| `standard`     | Maceta estándar                          | Ninguno | Libre          |
| `terracota`    | Macetas Terracota                        | Sí      | Bloqueado → cono |
| `plasticforte` | Macetas decorativas (Plasticforte)       | Sí      | Bloqueado → cono |

Factores de marca en `POT_TYPES` (`usesAdjustments: true`):

- **Terracota:** `exteriorFactor: 0.875`, `interiorFactor: 0.63`
- **Plasticforte:** `exteriorFactor: 1`, `interiorFactor: 0.656`

### Campos de entrada por combinación

| Forma          | Maceta estándar                          | Terracota / Plasticforte        |
|----------------|------------------------------------------|---------------------------------|
| Rectangular    | longitud, anchura, profundidad           | *(no disponible — forma bloqueada)* |
| Redondo        | diámetro, altura                         | *(no disponible)*               |
| Cono truncado  | diámetro superior, diámetro inferior, profundidad | diámetro superior (nominal), profundidad |

Los IDs de input: `length`, `width`, `depth`, `diameter`, `bottomDiameter`, `height`.

## Fórmulas de volumen

Todas las dimensiones en **cm**. Volumen en **cm³**, luego convertido a litros.

### Rectangular

```
volumen = profundidad × longitud × anchura
```

Solo disponible con **Maceta estándar**. Sin ajustes.

### Redondo (cilindro)

```
volumen = π × R² × altura
```

- **Maceta estándar:** `R = diámetro_usuario / 2` (medidas reales, sin corrección).
- **Terracota:** `R = (usuario × 0.875 × 0.63) / 2`
- **Plasticforte:** `R = (usuario × 0.656) / 2`

Funciones clave: `getInteriorDiameter()`, `calculateRound()`.

### Cono truncado

```
volumen = (1/3) × π × profundidad × (r² + r×R + R²)
```

Donde `R = diámetro_superior / 2` y `r = diámetro_inferior / 2`.

- **Maceta estándar:** el usuario introduce **ambos diámetros** y la profundidad directamente (sin factores).
- **Terracota / Plasticforte:** un solo diámetro superior nominal; el inferior se deriva con factores (ver tabla).

| Tipo (marca) | Diámetro superior              | Diámetro inferior        |
|--------------|--------------------------------|--------------------------|
| Terracota    | `usuario × 0.875`              | `superior × 0.63`        |
| Plasticforte | `usuario` (sin ajuste)         | `superior × 0.656`       |

Funciones clave: `getConeDiameters()`, `truncatedConeVolume()`, `calculateTruncatedCone()`.

#### Bug histórico corregido

Una versión anterior aplicaba erróneamente el 63% como diámetro interior único y estimaba el inferior con un ratio inventado (`coneBottomRatio: 0.55`), dando volúmenes ~3× menores que calculadoras de referencia. La lógica correcta deriva superior e inferior como en la tabla anterior.

#### Ejemplo de validación (Maceta estándar, cono)

- Entrada: superior **60,9 cm**, inferior **38,3 cm**, profundidad **51,5 cm**
- Resultado esperado: **~101 L**

#### Ejemplo de validación (Terracota, cono)

- Entrada: diámetro superior nominal **70 cm**, profundidad **51,5 cm**
- Superior real: `70 × 0.875 = 61,3 cm`
- Inferior: `61,3 × 0.63 = 38,6 cm`
- Resultado esperado: **~102 L** (referencia externa con 60,9 / 38,3 cm ≈ 101 L)

## Funciones principales en `app.js`

| Función                 | Responsabilidad                                      |
|-------------------------|------------------------------------------------------|
| `syncShapeLock()`       | Bloquea forma en cono solo para Terracota/Plasticforte (`isBrandPot()`) |
| `isBrandPot()`          | Indica si el tipo aplica factores y bloqueo de forma                    |
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
- **Título animado:** `.app-title` usa degradado desplazable (`titleGradientShift`) de rosa a menta en bucle continuo hacia la derecha.
- **Tema kawaii:** pasteles (rosa `#ffb7c5`, menta `#b8e8d4`), bordes redondeados, animación flotante en logo, gradientes suaves.
- Clases custom prefijadas con `kawaii-` en `styles.css`.
- Emojis como iconografía (sin librería de iconos externa).

### Diseño responsivo

Enfoque **mobile-first** en `styles.css` con tres breakpoints:

| Breakpoint | Rango        | Comportamiento principal |
|------------|--------------|--------------------------|
| Móvil      | `< 768px`    | Layout compacto para minimizar scroll. Cabecera horizontal (logo + título en fila). Selectores e inputs en **2 columnas** (`col-6`). Espaciados, tipografías y paddings reducidos. |
| Tablet     | `768–991px`  | Cabecera horizontal. Contenedor centrado (`max-width: 640px`). Tamaños intermedios. |
| Escritorio | `≥ 992px`    | Cabecera vertical centrada (logo encima del título). Espaciado amplio original. |

Detalles clave:
- `.app-main` usa `min-height: 100dvh` + flexbox; el footer se ancla al fondo con `margin-top: auto`.
- Variables CSS `--app-gap` controlan márgenes entre secciones del formulario.
- Media query `@media (max-height: 700px)` en móvil reduce aún más cabecera y espaciados en pantallas bajas (p. ej. iPhone SE).
- Los campos dinámicos en `app.js` usan `col-6` para mostrar siempre diámetro y profundidad en la misma fila.
- Las fórmulas van en `<details>` colapsado por defecto para no ocupar espacio vertical.

## Cómo ejecutar / desplegar

Abrir `index.html` directamente en el navegador o servir la carpeta con cualquier servidor estático.

Para GitHub Pages: publicar la raíz del repo (contiene `index.html`).

## Puntos de extensión habituales

1. **Nuevo tipo de maceta:** añadir entrada en `POT_TYPES`; actualizar `isBrandPot()` y `syncShapeLock()` si debe bloquear forma o aplicar factores.
2. **Nueva forma:** nuevo `case` en `calculate()` y rama en `renderInputFields()`.
3. **Ajustes rectangulares por tipo de marca:** hoy no existen; implementar en `calculateRectangular()` si se requieren.
4. **Sustituir `alert()` por toast/modal** para errores de validación.

## Dependencias externas (CDN)

- `bootstrap@5.3.3` CSS + JS bundle
- Google Fonts: Nunito 400/600/700/800

No hay `package.json` ni lockfiles.

## Idioma

Interfaz y mensajes en **español**. Locale de formato numérico: `es-ES` en `formatLiters()`.
