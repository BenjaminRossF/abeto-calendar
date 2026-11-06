<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- trail:start -->
## Trail — repo context graph

This repo is indexed in `.trail/cache/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `trail map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `trail ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `trail grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `trail skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `trail callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `.trail/cache/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `trail ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `trail build` (deterministic,
no API key, $0).
<!-- trail:end -->

## Reglas del proyecto

### Commits atómicos

- Cada commit debe representar un único cambio lógico, completo y revisable. Separa funcionalidades, correcciones y refactorizaciones independientes; incluye la documentación correspondiente al cambio.
- Utiliza Conventional Commits con el formato `tipo(alcance opcional): descripción`, por ejemplo `feat(calendar): agrega creación de eventos` o `fix(calendar): corrige la zona horaria`.
- Utiliza tipos como `feat`, `fix`, `docs`, `refactor`, `test`, `style`, `perf`, `build`, `ci` y `chore`. Señala cambios incompatibles con `!` y explica la incompatibilidad en el cuerpo del commit.
- Antes de crear un commit, revisa el diff y ejecuta las verificaciones pertinentes. No incluyas cambios ajenos a la tarea.

### Documentación de componentes

- Cada componente debe tener su propia documentación en `docs/`, incluidos los componentes de interfaz basados en shadcn/ui.
- Usa `docs/components/<ruta-del-componente>.md`, reflejando su ruta de origen para evitar nombres duplicados.
- Documenta su propósito, props, ejemplo de uso y, cuando corresponda, estados de carga, error, vacío e interacciones.
- Al crear o modificar un componente, crea o actualiza su documentación en el mismo cambio.

### Dependencias

- Antes de agregar cualquier paquete nuevo, solicita autorización explícita al usuario. Explica para qué se necesita y por qué las dependencias existentes no son suficientes.
- Esta regla incluye dependencias de producción y desarrollo, así como paquetes incorporados por comandos o generadores de componentes. No ejecutes la instalación ni modifiques los manifiestos o el lockfile para agregarlos antes de recibir autorización.

### Mutaciones y actualizaciones optimistas

- Implementa las mutaciones mediante Server Actions. Valida los datos y verifica los permisos en el servidor antes de modificar la base de datos.
- Utiliza actualizaciones optimistas para reflejar las mutaciones inmediatamente en la interfaz. Gestiona el estado pendiente y, si la operación falla, revierte el cambio optimista y muestra un error comprensible.
- Tras una mutación exitosa, sincroniza la interfaz con los datos confirmados y actualiza o revalida los datos afectados según las APIs de la versión instalada de Next.js.

### Diseño y componentes de interfaz

- Prioriza los componentes de shadcn/ui disponibles en el proyecto para construir la interfaz. Antes de crear un componente desde cero, evalúa si se puede componer o adaptar uno existente.
- Utiliza los colores y tokens semánticos del tema shadcn/ui del proyecto, por ejemplo `background`, `foreground`, `primary`, `muted`, `border` y `destructive`.
- Evita colores arbitrarios o valores de color hardcodeados cuando exista un token del tema. Respeta los modos claro y oscuro definidos por el proyecto.

### Prisma y acceso a datos

- Prisma es el ORM del proyecto. Utilízalo para acceder a la base de datos; no introduzcas otro ORM.
- Todas las lecturas de la base de datos deben iniciarse desde la página (`page.tsx`), en el servidor. Pueden delegarse en funciones de acceso a datos ejecutadas únicamente en el servidor.
- La página debe entregar los resultados a los componentes hijos mediante props. Los hijos no deben consultar la base de datos, importar Prisma ni iniciar peticiones para obtener esos mismos datos.
- Las escrituras se ejecutan mediante las Server Actions indicadas arriba. Un componente hijo puede invocar una acción recibida o conectada a su formulario, sin realizar acceso directo a la base de datos.
- Entrega a los hijos únicamente los campos necesarios y usa datos serializables al cruzar el límite entre componentes de servidor y cliente.

### Renderizado y estados de carga

- Prioriza el renderizado en el servidor y los Server Components. Limita `"use client"` a los componentes que requieran interacción, estado del navegador o APIs exclusivas del cliente.
- Utiliza `Suspense` con skeletons para los estados de carga. Los skeletons deben reflejar la estructura del contenido para reducir saltos visuales.
- Coloca los límites de `Suspense` donde permitan mostrar contenido útil mientras se resuelven los datos pendientes, y usa `loading.tsx` cuando corresponda a la carga de una ruta.
- Mantén las consultas en la página: pasa promesas o resultados a los hijos según las APIs soportadas por la versión instalada, sin trasladar las consultas a componentes hijos para implementar la carga progresiva.

### Accesibilidad

- Utiliza HTML semántico y nombres accesibles para controles, campos y acciones. Asocia cada campo con su etiqueta y sus mensajes de validación.
- Todas las interacciones deben funcionar con teclado. Mantén un foco visible y gestiona su entrada y retorno al abrir o cerrar diálogos y otros elementos superpuestos.
- Respeta el contraste del tema y las preferencias de movimiento reducido. No comuniques estados únicamente mediante colores.
- Haz perceptibles para tecnologías de asistencia los estados pendientes, errores y resultados de las acciones, sin generar anuncios repetitivos.

### Estados de error y vacío

- Cada vista que dependa de datos debe contemplar carga, éxito, ausencia de resultados y error. Distingue una colección vacía de un fallo al obtenerla.
- Los estados vacíos deben explicar la situación y ofrecer una acción útil cuando corresponda.
- Muestra errores comprensibles y una forma de recuperación o reintento cuando sea posible. Conserva los datos del formulario ante errores recuperables.
- Utiliza los límites de error de Next.js que correspondan y evita exponer detalles internos, credenciales o datos sensibles en los mensajes.

### Migraciones y protección de datos

- Versiona los cambios de esquema de Prisma junto con sus migraciones. Revisa el SQL generado y su impacto sobre los datos existentes antes de aplicarlo.
- Prioriza migraciones compatibles y por etapas cuando haya cambios de nombre, campos obligatorios o transformaciones de datos; define cómo completar los datos existentes antes de imponer nuevas restricciones.
- Antes de aplicar una migración destructiva, eliminar datos o ejecutar un reset, solicita autorización explícita indicando el entorno afectado y el impacto. Para entornos con datos persistentes, confirma que exista un respaldo recuperable.
- No modifiques migraciones ya aplicadas en entornos compartidos; crea una nueva migración correctiva. No ejecutes comandos de desarrollo o reset contra producción.
- Usa transacciones cuando varias escrituras deban completarse como una sola operación y verifica las restricciones de integridad pertinentes.

### Testeabilidad y pruebas

- Separa la lógica de negocio de la interfaz, las Server Actions y el acceso a datos. Prioriza funciones puras con entradas y salidas explícitas para reglas, validaciones y transformaciones.
- Mantén componentes con responsabilidades acotadas y contratos de props claros. Los componentes hijos deben poder probarse con datos y acciones proporcionados por la prueba, sin depender de una base de datos o sesión real.
- Encapsula los efectos externos y permite controlar dependencias como reloj, generación de identificadores y servicios externos cuando afecten al comportamiento. Evita añadir abstracciones que no tengan una necesidad concreta.
- Elige las pruebas según el riesgo: unitarias para reglas de negocio, integración para acceso a datos y Server Actions, y pruebas de extremo a extremo para recorridos críticos. No agregues pruebas que solo reproduzcan la implementación ni exijas pruebas nuevas para cambios reversibles de bajo impacto sin comportamiento relevante.
- Comprueba resultados observables y comportamientos del usuario. En pruebas de interfaz, prioriza consultas por rol, nombre accesible o etiqueta sobre selectores ligados al DOM o a clases CSS.
- Para las mutaciones, cubre según corresponda validación, autorización, éxito, errores y consistencia de datos. Para actualizaciones optimistas, comprueba el estado pendiente, la confirmación y la reversión ante fallos.
- Mantén las pruebas deterministas y aisladas: controla fechas, zonas horarias y aleatoriedad; espera condiciones observables en lugar de pausas arbitrarias. Para lógica de calendario, considera cambios de día, horario de verano y límites de fechas.
- Las pruebas que escriban datos deben usar una base de datos exclusiva de pruebas, con datos de prueba controlados y limpieza entre casos. Nunca deben escribir en producción ni depender de datos personales o servicios reales para ser repetibles.
- Reutiliza las herramientas de prueba instaladas. Si hace falta agregar un paquete, aplica primero la política de autorización de dependencias.
- Al corregir un error de comportamiento, agrega una prueba de regresión cuando sea viable y proporcional al riesgo. Documenta en `docs/` los comandos y requisitos necesarios para ejecutar las pruebas pertinentes.

### Verificaciones antes de cada commit

- Ejecuta los comandos de lint y comprobación de tipos definidos por el proyecto antes de cada commit, además de las pruebas pertinentes al cambio. No inventes scripts ni des por realizada una verificación que no se ejecutó.
- Revisa el diff para detectar errores de formato, cambios accidentales y secretos. Confirma que la documentación de los componentes afectados esté actualizada.
- Si falta una herramienta o una verificación no puede ejecutarse, informa la limitación y su causa. Distingue los fallos preexistentes de los introducidos por el cambio y no presentes una verificación fallida como aprobada.
