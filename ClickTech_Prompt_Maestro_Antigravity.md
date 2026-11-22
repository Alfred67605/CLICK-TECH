# PROMPT MAESTRO PARA ANTIGRAVITY — CLICKTECH

Actúa como un equipo de desarrollo full stack, diseño de interfaces, análisis de negocio y verificación de software. Implementa una aplicación web completa para **ClickTech**, un emprendimiento de venta de tecnología y servicios técnicos en **Potosí, Bolivia**. Trabaja sobre el repositorio abierto; si no existe una aplicación, créala. Ejecuta el trabajo hasta dejar una versión local funcional, con base de datos, imágenes, cuentas de demostración y pruebas de los procesos principales.

La entrega debe ser una tienda tecnológica con operación comercial y técnica integrada. Cada pantalla y acción debe estar conectada con su proceso real y persistir sus cambios. No termines después de generar una portada, un prototipo visual o un conjunto de pantallas con datos incrustados.

## 0. Skills solicitadas y verificación con Playwright

**Utiliza expresamente Find/Find Skills, HyperFrames, las skills de Emil Kowalski, Impeccable, Taste Skill y Playwright durante el desarrollo.** Su aplicación debe producir cambios y evidencias concretas. Este bloque complementa todos los requisitos funcionales y visuales posteriores.

La referencia del usuario a «tasta skills» se interpreta como **Taste Skill / taste-skill**. Verifica el nombre real instalado; no busques ni instales un paquete arbitrario llamado «tasta».

### 0.1. Descubrimiento, preparación y registro

1. Inspecciona las skills y herramientas ya disponibles en Antigravity y en el proyecto. Usa **find**, **find-skills** o su equivalente de descubrimiento realmente instalado. Distingue esta capacidad del comando de sistema para buscar archivos.
2. Resuelve los nombres y fuentes a partir de los proyectos de sus autores indicados abajo. Reutiliza las instalaciones existentes. Si falta alguna, sigue su documentación vigente para instalar únicamente los componentes necesarios en un ámbito compatible con Antigravity, preferiblemente del proyecto.
3. Lee el `SKILL.md` de cada skill elegida y las referencias requeridas antes de aplicarla. Comprueba dependencias, versión, comandos y forma de invocación; no supongas que todos los agentes usan los mismos comandos o carpetas.
4. Registra en `docs/SKILLS_USAGE.md`: nombre real, autor/fuente, versión o commit si está disponible, estado, instrucciones leídas, tarea realizada, archivos afectados y evidencia. Distingue «descubierta», «instalada», «aplicada» y «bloqueada». Mencionar una skill en el informe no demuestra haberla usado.
5. Si una dependencia falta o una instalación falla, explica la causa concreta, conserva el avance y continúa con las partes disponibles. No declares aplicada una skill que no pudiste cargar. Para servicios externos, respeta las credenciales y condiciones disponibles; no actives consumos de pago por suposición.
6. Conserva la configuración existente al añadir skills o MCP. No reemplaces todo un archivo de configuración para añadir una entrada, no deshabilites las protecciones del entorno y no instales catálogos completos por defecto.

### 0.2. Función concreta de cada recurso

| Recurso solicitado | Fuente de referencia | Aplicación obligatoria en ClickTech |
| --- | --- | --- |
| Find / Find Skills | [vercel-labs/skills](https://github.com/vercel-labs/skills), o la herramienta de descubrimiento instalada que corresponda | Descubrir y resolver las skills solicitadas; verificar nombres, fuentes y disponibilidad antes de usarlas |
| Taste Skill | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Dirección artística, composición, jerarquía, fotografía de hardware y coherencia del sistema visual |
| Impeccable | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Revisión y mejora de tipografía, espaciado, contraste, adaptabilidad, estados y acabado de las pantallas |
| Emil Kowalski | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Diseño y revisión del movimiento: entradas, carrito, selectores, diálogos, notificaciones y transiciones |
| HyperFrames | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Crear una pieza de marca o hardware animada y editable para integrar en el inicio |
| Playwright | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) y [Playwright Test](https://playwright.dev/docs/intro) | Navegar la aplicación real, comprobar recorridos, inspeccionar diseño y ejecutar pruebas reproducibles |

**Coordinación:** Taste define la dirección visual; Impeccable revisa y pule la interfaz; Emil Kowalski guía el movimiento interactivo; HyperFrames produce una pieza audiovisual; Playwright comprueba el resultado en navegador. Adapta las recomendaciones generales a la identidad y operación de ClickTech. Conserva el logo, la paleta y las rejillas útiles del comercio electrónico aunque una plantilla de skill sugiera otra paleta, un sitio estático o secciones de pantalla completa. Documenta las decisiones cuando haya conflictos.

### 0.3. Taste e Impeccable: diseño aplicado y revisión

Usa Taste para definir una dirección tecnológica/gamer con fotografías de componentes y un sistema común de tipografía, superficies, colores, espaciados e iconos. Consulta el identificador real de la skill; la instalación puede exponer un nombre distinto al del repositorio. Documenta las decisiones en `DESIGN.md` y reutilízalas en tienda, configurador, cuenta y administración.

Usa Impeccable primero para revisar las pantallas principales y después para corregir hallazgos. Aplica sus capacidades de crítica, auditoría, adaptación y pulido mediante las invocaciones disponibles en la versión instalada. Revisa especialmente hero, tarjetas de producto, ficha, configurador, checkout y orden técnica. Los hallazgos deben traducirse en cambios o decisiones justificadas, manteniendo la legibilidad y las tareas del cliente como prioridad.

### 0.4. Emil Kowalski: movimiento con intención

Selecciona las skills de diseño de interfaces y animación pertinentes dentro de su colección, leyendo sus nombres vigentes. Define curvas, duraciones y propiedades para interacciones concretas: añadir al carrito, abrir el panel del carrito, elegir componentes, validar formularios, cambiar estados y mostrar confirmaciones.

Las animaciones deben responder al usuario sin retrasar sus acciones. Revisa rendimiento, interrupciones, navegación con teclado, estados táctiles y movimiento reducido. No basta con añadir una biblioteca de animación o aplicar el mismo efecto a todos los elementos.

### 0.5. HyperFrames: pieza de marca integrada

Usa HyperFrames para crear una composición editable de aproximadamente **6 a 10 segundos**, con el logo original, hardware real autorizado, iluminación cian/morada y el lema «Tecnología a tu medida». Debe funcionar como recurso visual del hero o de una sección de marca, sin tapar texto, buscador ni botones de compra.

Sigue el flujo real de la versión instalada: composición, recursos, previsualización, validación y render. Entrega su fuente editable, el recurso exportado y una imagen de portada. Integra una versión web optimizada y conserva una alternativa estática cuando el navegador, dispositivo o preferencia de movimiento lo requieran. No fuerces reproducción con sonido ni bloquees la navegación durante una introducción.

HyperFrames se aplica a esta pieza audiovisual. Las interacciones de compra, cuenta y administración se implementan con componentes web accesibles. Si no es posible renderizar por una limitación comprobada, conserva lo realizado, registra exactamente qué falta y utiliza la portada estática sin afirmar que el render está terminado.

### 0.6. Playwright: exploración y pruebas reproducibles

Usa Playwright MCP si está disponible para inspección y navegación interactiva; usa Playwright Test para guardar pruebas de los recorridos críticos en el repositorio. Si MCP no está disponible, utiliza las capacidades de Playwright accesibles por CLI/Test y documenta esa diferencia. Playwright es una herramienta de automatización y pruebas; no presupongas que está instalada como una skill con ese mismo nombre.

Abre la aplicación local servida por HTTP y comprueba acciones reales con datos de prueba aislados. Verifica búsqueda, filtros, comparación, carrito, checkout, configurador, aceptación de cotización, seguimiento técnico y permisos. Los cambios realizados en la interfaz deben reflejarse en la base de datos.

Revisa las pantallas clave en **360, 768, 1024 y 1440 px** de ancho: desbordamientos, cortes de texto, imágenes ausentes, navegación, foco, errores de consola, respuestas fallidas y movimiento reducido. Usa selectores por rol o etiquetas cuando sea posible y esperas por estados observables; evita pausas arbitrarias para ocultar problemas.

Guarda el código de pruebas y un reporte de resultados. Las capturas de revisión deben usar exclusivamente datos ficticios y omitir secretos. Corrige los fallos, repite los escenarios afectados y registra limitaciones. Una captura atractiva no sustituye las comprobaciones funcionales, de autorización o de inventario.

**Orden de aplicación:** descubrimiento → lectura de instrucciones → dirección visual → implementación → movimiento y pieza HyperFrames → revisión Impeccable → verificación Playwright → correcciones y entrega. Realiza revisiones durante el trabajo cuando resuelvan decisiones concretas.

## 1. Contexto autorizado de la marca

**Nombre:** ClickTech.
**Lema principal:** «Tecnología a tu medida».
**Mensaje emocional complementario:** «Más que tecnología, es tu pasión».
**Ubicación inicial:** Potosí y zonas cercanas, Bolivia.
**Modelo:** comercio electrónico + servicios técnicos + atención digital, con ventas B2C y solicitudes B2B.

ClickTech comercializa computadoras de escritorio, laptops, componentes, periféricos y accesorios. Complementa la venta con asesoramiento, diagnóstico, mantenimiento preventivo y correctivo, reparación, actualización, instalación y ensamblaje personalizado de computadoras. Atiende mediante la web, redes sociales y WhatsApp Business, con entrega o recojo coordinado según cobertura y disponibilidad.

Su misión consiste en ofrecer soluciones accesibles, confiables y personalizadas, acompañando al cliente antes y después de comprar. Su visión es consolidarse como una alternativa digital reconocida por una experiencia ágil, un catálogo en crecimiento y soporte confiable para personas y organizaciones.

**Prioridad comercial:** gamers, inicialmente entre 16 y 35 años, interesados en rendimiento, personalización y mejoras acordes con su presupuesto. Es una segmentación de marketing; no la conviertas en una exclusión de otros clientes ni solicites fecha de nacimiento sin necesidad.

**Públicos secundarios:** estudiantes, profesionales y pequeñas empresas. Familias e instituciones también pueden solicitar productos o servicios. Los creadores de contenido son un uso complementario del hardware, sin desplazar la prioridad gamer.

Los perfiles Diego, estudiante gamer de 22 años, y Andrea, persona de 24 años que estudia y trabaja, son ejemplos hipotéticos para diseñar recorridos. No los presentes como clientes reales ni como testimonios.

### Base documental y su traducción funcional

| Documento | Qué define | Cómo debe aparecer en la aplicación |
| --- | --- | --- |
| Actividad 2 | Venta digital, servicios, B2C/B2B y gestión propia | Tienda, clientes, compras, inventario, proveedores, garantías, órdenes técnicas y reportes |
| Actividad 4 | Solución integral y distintas fuentes de ingreso | Compra de productos, contratación de servicios, ensamblaje y atención a empresas |
| Actividad 5 | Gamers como prioridad, necesidades y experiencia del cliente | Cotización por presupuesto, comparación, compatibilidad, diagnóstico, costos claros y seguimiento |
| Presentación de marca | Identidad, lemas y colores | Logo original, cian, morado, apariencia tecnológica y comunicación cercana |

Usa la Actividad 5 para priorizar la experiencia. Conserva los servicios y públicos definidos en los otros documentos. La presentación de marca contiene frases promocionales como «primera marca», «100 %» y «cero fallas»: no las publiques como hechos verificados ni prometas resultados absolutos.

## 2. Principio central de la experiencia

Implementa este recorrido: **escuchar → proponer → resolver → acompañar**.

1. Escuchar: conocer uso, juegos o programas, equipo actual, problema y presupuesto.
2. Proponer: comparar opciones y presentar una cotización detallada, comprensible y aceptable por el cliente.
3. Resolver: vender, instalar, ensamblar o reparar, registrando el trabajo y sus comprobaciones.
4. Acompañar: permitir seguimiento, garantías, consultas e historial de futuras mejoras.

Resuelve expresamente los cuatro puntos de dolor de la Actividad 5:

| Necesidad | Respuesta funcional obligatoria |
| --- | --- |
| Presupuesto limitado | Asesor por presupuesto, alternativas y mejoras por etapas |
| Lentitud y fallas | Solicitud de diagnóstico, orden técnica y pruebas registradas |
| Componentes incompatibles | Configurador con reglas verificables y revisión técnica |
| Desconfianza y cargos ocultos | Desglose de costos, aceptación de cotizaciones, avances y postventa |

## 3. Dirección visual: tecnología y hardware como protagonistas

Diseña una identidad propia y cuidada, con impacto gamer, fotografía real de productos y excelente legibilidad. La tienda debe transmitir tecnología, rendimiento y confianza desde la primera pantalla.

### Logo y recursos de marca

- Usa **logo_user_overlay.png** como recurso transparente cuando su contraste y tamaño lo permitan.
- Usa **clicktech_logo_original.jpg** como referencia de identidad o en secciones de marca donde su fondo tenga sentido.
- Localiza estos archivos en los recursos adjuntos o en el proyecto y cópialos a una carpeta estable de recursos. No dependas de rutas temporales externas al repositorio.
- Conserva proporción, colores y composición del logo. No lo redibujes con texto, emojis o un símbolo genérico; no lo estires ni recortes partes.
- El encabezado debe mostrar el logo con tamaño legible, sin desperdiciar espacio por los márgenes internos de su lienzo. Cualquier adaptación debe preservar el arte y conservar el original.
- Si los archivos no están disponibles, registra esa dependencia y prepara el punto de sustitución; no inventes un logo oficial.

### Paleta de la marca

| Uso | Color |
| --- | --- |
| Acento principal y acciones | Cian #00E5FF |
| Acento secundario y ambiente gamer | Morado #8B5CF6 |
| Fondo principal | Negro chasis #02040A |
| Texto principal y contraste | Blanco #FFFFFF |

Añade superficies grafito, grises legibles y un azul eléctrico complementario si aporta profundidad. Usa degradados cian–morado, iluminación suave, bordes finos y transparencias contenidas. Mantén contraste suficiente en botones, formularios y tablas. Ofrece tema claro si encaja, manteniendo la identidad; la prioridad es que ambos contextos sean legibles.

### Composición y movimiento

- Encabezado fijo con logo, buscador, categorías, acceso al configurador, servicios, cuenta y carrito.
- Hero amplio: texto «Tecnología a tu medida», breve propuesta de valor y una PC gamer o composición de hardware real de alta calidad. Acciones «Explorar productos» y «Armar mi PC».
- La fotografía debe ocupar una parte importante del hero. Evita una portada formada principalmente por texto y espacios vacíos.
- Secciones con jerarquía clara, tipografía moderna y cuerpo fácil de leer. Usa iconos consistentes, sin emojis como iconografía del producto.
- Tarjetas de productos con imagen grande, marca, modelo, precio, disponibilidad y acciones visibles.
- Rejillas de cuatro columnas cuando el ancho lo permita, dos en tablet y una o dos en móvil según la legibilidad. Adapta densidad y márgenes al dispositivo.
- Animaciones breves: entrada de secciones, elevación de tarjetas, cambio de imagen, apertura del carrito y transiciones de estados. Evita movimientos continuos que distraigan.
- Puedes añadir profundidad y movimiento 3D en el hero si cuentas con un modelo apropiado y optimizado. Implementa carga diferida y alternativa estática; las fotos y la compra deben funcionar sin WebGL.
- Respeta la preferencia de movimiento reducido. No agregues audio automático, cursores que impidan usar la interfaz ni efectos pesados en todo el catálogo.
- El panel de gestión necesita navegación, tablas y formularios de alta claridad, con los acentos de marca de forma moderada.

## 4. Fotografías y contenido de productos

Incorpora desde la primera entrega imágenes reales de PCs, laptops, tarjetas gráficas, procesadores, memorias, SSD, placas madre, fuentes, gabinetes, monitores y periféricos. No sustituyas productos por bloques de color o iconos.

Usa primero recursos disponibles y, después, imágenes con condiciones de uso apropiadas o recursos oficiales cuando su uso esté permitido. Verifica origen y derechos; una imagen pública no implica permiso de reutilización. Guarda los recursos autorizados dentro del proyecto, optimízalos y registra origen, atribución y condiciones en `docs/ASSETS.md`.

Una imagen vinculada a un SKU debe corresponder a ese modelo. Si solo tienes una imagen de categoría, márcala como ilustrativa y no la presentes como fotografía exacta del producto. No fabriques especificaciones, certificaciones, garantías, reseñas ni cifras de FPS. No inventes enlaces de imágenes.

Cada ficha debe tener imagen principal útil, texto alternativo y galería cuando haya material. Usa `contain` en fotos de productos para que el componente se vea completo. Reserva `cover` para banners y fotografías ambientales. Evita fondos blancos accidentales dentro de composiciones oscuras cuando existan recursos adecuados.

Si falta material verificable para un SKU, documenta la limitación, usa una alternativa ilustrativa bien identificada y permite reemplazarla desde administración. No declares el catálogo visual terminado si predominan imágenes ausentes o repetidas.

## 5. Tienda pública

### Inicio

Incluye hero, categorías visuales, productos destacados, PCs armadas por uso o presupuesto, acceso a «Arma tu PC», asesoría, servicios técnicos, explicación del proceso de atención y preguntas frecuentes. Añade información de ClickTech y un pie con contacto, cobertura y políticas configurables.

Solo muestra promociones con condiciones configuradas. No inventes porcentajes, contadores de ventas, clientes satisfechos, marcas asociadas ni opiniones.

### Catálogo y ficha

- Categorías: PCs armadas, laptops, procesadores, tarjetas gráficas, placas madre, RAM, almacenamiento, fuentes, gabinetes, refrigeración, monitores, periféricos y accesorios.
- Búsqueda por nombre, marca, modelo y SKU; filtros por categoría, precio, marca, disponibilidad y atributos relevantes para cada categoría.
- Ordenamiento por precio, novedades y otros criterios respaldados por datos.
- Ficha con precio en **Bs**, stock, variantes cuando existan, especificaciones verificadas, fotos, condiciones de garantía y entrega.
- Comparación de dos a cuatro productos de la misma categoría, alineando atributos equivalentes y mostrando los datos faltantes.
- Favoritos, productos relacionados y accesorios compatibles cuando existan reglas o relaciones comprobadas.
- Acciones «Añadir al carrito», «Solicitar asesoría» y «Consultar por WhatsApp» si el canal está configurado.

### Carrito y compra

Implementa carrito persistente, edición de cantidades, eliminación, subtotal, descuentos aplicables, envío, servicios añadidos y total. Revalida precios, promociones y disponibilidad en el servidor antes de crear el pedido.

El checkout debe permitir datos de contacto, método de entrega, dirección cuando corresponda, resumen final y forma de pago. La navegación y el carrito no requieren registro; permite compra como invitado si puedes asociarla de manera segura a una cuenta posterior mediante verificación.

Ofrece recojo coordinado en Potosí y entregas solo en zonas configuradas. Cuando no exista una tarifa o cobertura definida, ofrece solicitar cotización de entrega. No uses envío gratuito ni cobertura nacional como valores inventados.

Implementa inicialmente pago por transferencia o QR con revisión manual, y pago al recoger si la administración lo habilita. Los datos bancarios y el QR deben venir de configuración real; si faltan, deshabilita la opción correspondiente y explica su disponibilidad sin bloquear los demás flujos.

Subir un comprobante no confirma el pago. Un usuario autorizado debe revisarlo y registrar aprobación o rechazo con trazabilidad. Un QR estático no equivale a una pasarela integrada. Mantén separados estado del pedido, del pago y de la entrega. No solicites datos de tarjetas ni muestres un cobro automático sin un proveedor real.

Entrega un comprobante de pedido descargable. No lo presentes como factura fiscal si no existe una integración de facturación habilitada.

## 6. Configurador «Arma tu PC»

Este módulo debe destacar y funcionar con el catálogo real.

1. Pregunta presupuesto en Bs, uso principal, juegos o programas, equipo actual y preferencias. Distingue una PC nueva de una actualización.
2. Permite elegir procesador, placa madre, RAM, GPU cuando sea necesaria, almacenamiento, fuente, gabinete y refrigeración. Añade periféricos como opcionales.
3. Muestra piezas elegidas, disponibilidad, precio unitario, subtotal, costo de ensamblaje configurado y diferencia frente al presupuesto.
4. Permite guardar, compartir de manera segura, solicitar revisión, descargar cotización y convertir una propuesta aceptada en pedido.
5. Ofrece alternativas y mejoras por etapas. Explica qué necesidad atiende cada cambio, sin asegurar FPS o rendimiento no medido.

Modela reglas de compatibilidad con datos estructurados: socket, soporte del procesador por placa y BIOS cuando se conozca, generación y capacidad de RAM, formato de placa y gabinete, espacio para GPU y refrigeración, interfaces de almacenamiento y conectores/capacidad de alimentación.

No reduzcas toda la compatibilidad a comparar sockets ni al tamaño comercial de la fuente. Los datos desconocidos deben producir **«Requiere revisión técnica»**, no un aprobado. Distingue «Compatible según los datos registrados», «Incompatible» y «Requiere revisión». Conserva advertencias y versión de la configuración.

La recomendación por presupuesto puede funcionar con reglas explicables. No es obligatorio conectar un modelo de IA ni presentar reglas como inteligencia artificial. La revisión humana debe quedar disponible antes de confirmar configuraciones con información incompleta.

## 7. Servicios técnicos y seguimiento

Catálogo de diagnóstico, mantenimiento preventivo/correctivo, reparación, actualización, ensamblaje, instalación y soporte a pequeñas empresas. Cada servicio permite descripción, alcance, precio fijo o «sujeto a diagnóstico» y condiciones configurables.

El formulario registra servicio, tipo de equipo, marca/modelo, síntomas, fotos opcionales, disponibilidad y modalidad de entrega. No pidas contraseñas del equipo en formularios públicos. La solicitud debe convertirse en un registro persistente visible para cliente y personal autorizado.

Gestiona este recorrido con reglas de transición:

**Solicitud recibida → Coordinación → Equipo recibido → Diagnóstico → Cotización pendiente de aprobación → Trabajo autorizado → En proceso → Pruebas → Listo para entrega → Entregado.**

Contempla cancelación, cotización rechazada y espera de repuestos. No permitas ejecutar trabajos con costo sin aprobación de la cotización correspondiente. Un cambio de costo requiere una nueva versión y aceptación; conserva el historial anterior.

La orden registra identificación del equipo y serie si procede, accesorios recibidos, estado inicial, fotos, técnico responsable, diagnóstico, mano de obra, repuestos, fechas acordadas y comprobaciones de cierre. Separa notas internas de información visible al cliente.

El cliente ve una línea de tiempo con mensajes comprensibles, presupuesto aceptado, cambios y siguientes pasos. Las notas con datos de otros clientes o información interna nunca deben aparecer allí. Al cerrar, entrega resumen del trabajo, pruebas realmente realizadas y recomendaciones de mantenimiento.

## 8. Cuenta del cliente, asesoría y B2B

Implementa registro, ingreso, cierre de sesión, recuperación de acceso mediante un mecanismo disponible y perfil. Cada cliente accede únicamente a sus pedidos, pagos, direcciones, cotizaciones, configuraciones guardadas, servicios, garantías y consultas.

La recuperación por correo necesita un adaptador: si no hay proveedor configurado, deja una alternativa de desarrollo documentada y no afirmes haber enviado mensajes externos.

Incluye consultas vinculadas a pedido o servicio para acompañamiento postventa. El enlace de WhatsApp lleva contexto del producto o solicitud y solo aparece con un número configurado. No inventes teléfono, correo o dirección del negocio.

Para empresas e instituciones incluye solicitud de cotización por cantidades, equipos requeridos y soporte. Regístrala en gestión comercial; no inventes contratos ni planes vigentes.

Las garantías deben vincularse a la compra o servicio, con duración y condiciones registradas, evidencia de entrega cuando corresponda y solicitudes de atención. No supongas un año para todos los productos. Las políticas comerciales pendientes deben identificarse como pendientes de configuración antes de operar con clientes reales.

## 9. Panel de administración y operación

Implementa cuatro roles iniciales, con permisos comprobados en el servidor:

| Rol | Acceso |
| --- | --- |
| Administrador | Configuración, usuarios, permisos y toda la operación |
| Ventas/atención | Clientes, cotizaciones, pedidos, pagos y coordinación comercial según permisos |
| Técnico | Órdenes asignadas, diagnóstico, propuestas técnicas, avance y pruebas |
| Cliente | Sus propios datos y operaciones |

El técnico no necesita ver costos de compra, márgenes ni credenciales de integraciones. Solo roles autorizados confirman pagos, ajustan stock o cambian permisos.

Módulos obligatorios:

- **Resumen:** ventas cobradas, pedidos pendientes, servicios activos, stock bajo y cotizaciones abiertas. Todo calculado desde la base de datos.
- **Productos:** CRUD, categorías, marcas, atributos por categoría, imágenes, SKU único, costos internos, precios, publicación, stock mínimo y garantía.
- **Inventario:** entradas, salidas, reservas, liberaciones, ajustes con motivo, devoluciones y trazabilidad. Conserva historial de movimientos.
- **Compras y proveedores:** órdenes de compra y recepción parcial o total. El stock aumenta al recibir, no al registrar una intención de compra.
- **Pedidos y ventas:** detalle, preparación, entrega, cancelación y documentos asociados.
- **Pagos:** pendientes, comprobantes privados, revisión y registro de cambios. Incluye devolución cuando corresponda al flujo implementado.
- **Cotizaciones:** propuestas por presupuesto, configuraciones, productos, servicios y solicitudes B2B; vigencia, versiones y aceptación.
- **Servicio técnico:** agenda, capacidad disponible, asignación, equipo recibido, diagnóstico, repuestos, aprobación y cierre.
- **Clientes y garantías:** historial unificado, consultas y solicitudes postventa.
- **Contenido/configuración:** banners, destacados, canales de atención, zonas, tarifas, horarios, medios de pago y condiciones.
- **Reportes:** ventas por período y categoría, productos vendidos, inventario, servicios y márgenes estimados cuando existan costos suficientes.
- **Auditoría:** cambios de pagos, precios, stock, estados, permisos y cotizaciones, con actor y fecha; sin registrar contraseñas ni secretos.

Los gráficos deben responder a filtros y abrir los registros que explican sus cifras. Usa gráficas legibles de ventas, distribución por categoría y estados de servicio. Evita gráficos 3D que deformen comparaciones. Exporta CSV y documentos PDF donde sean útiles.

## 10. Datos y reglas de integridad

Diseña un modelo relacional que cubra usuarios/roles, clientes, direcciones, catálogo, imágenes, atributos de compatibilidad, proveedores, compras/recepciones, movimientos/reservas de stock, carrito, pedidos/detalles, pagos, entregas, cotizaciones/versiones, configuraciones, servicios/citas, órdenes técnicas, historial, garantías, consultas, notificaciones, configuración y auditoría.

Explica relaciones, restricciones e índices en `docs/DATA_MODEL.md`. No guardes toda la operación en un único JSON ni uses localStorage como base de datos de ventas, pagos o servicios.

Reglas obligatorias:

1. Usa cantidades monetarias exactas, mediante decimales o centavos enteros, y moneda BOB presentada como Bs. No sumes dinero con flotantes sin una estrategia de precisión.
2. Guarda en cada operación una copia del nombre/modelo, precio, costo aplicable y condiciones necesarios para preservar su historial.
3. Define stock disponible como existencias menos reservas activas. Reserva al confirmar el pedido en una transacción; revalida en el servidor y evita que dos clientes compren la última unidad.
4. El carrito y una cotización sin aceptación no reservan automáticamente stock. Las reservas tienen vencimiento configurado, liberación idempotente y procesamiento documentado. Un pago tardío requiere nueva comprobación de stock.
5. Separa venta, cobro, entrega, cancelación y devolución. Una cancelación libera reservas; una devolución física aumenta existencias solo tras recibir y validar el producto. Evita duplicar reintegros de stock.
6. Un comprobante, un doble clic, un reintento o un evento repetido no deben duplicar pedidos, cobros, recepciones o movimientos. Implementa idempotencia en operaciones críticas.
7. Las piezas utilizadas en reparación o ensamblaje también afectan inventario mediante movimientos vinculados.
8. Conserva órdenes históricas aunque un producto deje de publicarse. Usa desactivación o archivado cuando eliminar rompa trazabilidad.
9. Al convertir una cotización en pedido vuelve a validar vigencia, disponibilidad y condiciones aceptadas; informa cambios antes de confirmar.
10. Guarda fechas de forma consistente y presenta horarios en **America/La_Paz**. Evita reservas de servicio incompatibles con horarios y capacidad configurados.

## 11. Arquitectura e implementación

Primero inspecciona el proyecto y sus instrucciones. Si existe una base mantenible, conserva su stack y explica cualquier cambio necesario. Si empiezas desde cero, usa **Next.js con TypeScript, PostgreSQL y Prisma**, con versiones estables compatibles verificadas en documentación oficial al comenzar. Añade Tailwind CSS, componentes accesibles, iconos coherentes y bibliotecas mantenidas para animación, gráficos y formularios según necesidad. Registra versiones y lockfile; no instales versiones incompatibles por asumir que sus APIs no cambiaron.

Separa dominio, acceso a datos, validaciones y presentación. Organiza por catálogo, pedidos, inventario, cotizaciones y servicios. Implementa migraciones y seed repetible. El servidor calcula totales y verifica permisos y propiedad de cada recurso.

Implementa autenticación con una biblioteca mantenida, sesiones seguras y contraseñas con hash apropiado. Verifica autorización en cada entrada al servidor que lea o modifique información privada. Ocultar botones o proteger una ruta visualmente no es suficiente.

Valida entradas, aplica límites a intentos de autenticación y formularios sensibles, maneja errores sin revelar datos internos y evita exponer secretos en el cliente o en git. Los archivos privados, especialmente comprobantes y fotos de servicio, requieren acceso autorizado. Valida tamaño y tipo real de las cargas; no ejecutes su contenido.

Usa variables de entorno documentadas, `.env.example` sin secretos y configuración para base de datos, archivos, correo y futuras integraciones. La experiencia local debe funcionar con pagos revisados manualmente y notificaciones internas aunque no haya credenciales externas.

WhatsApp, correo, pagos automáticos y facturación deben implementarse mediante adaptadores cuando aplique. No agregues servicios de pago ni dependencias externas obligatorias para demostrar el núcleo. Si una integración falta, identifica exactamente lo pendiente y deja funcionar los procesos disponibles.

Incluye estados de carga, errores, vacíos, confirmaciones y reintentos. Elimina enlaces rotos y botones sin acción. Garantiza uso con teclado, foco visible, etiquetas, contraste y alternativas textuales. Prueba en móvil y escritorio; las tablas administrativas necesitan adaptación útil.

## 12. Datos de demostración y configuración pendiente

Prepara al menos 30 productos distribuidos entre las categorías relevantes, con modelos y especificaciones verificables, imágenes y atributos útiles. Incluye tres configuraciones de PC para demostrar selección por presupuesto y al menos seis servicios configurables.

Los precios, costos, existencias y operaciones ficticias son **datos de demostración**, no cotizaciones actuales de Potosí. Identifica el entorno de demostración mediante un aviso discreto, y documenta cómo retirar el seed sin eliminar información real.

Incluye clientes ficticios, pedidos en diferentes estados, pagos pendientes/revisados, cotizaciones aceptadas y rechazadas, movimientos de inventario y órdenes técnicas en distintas etapas. Los gráficos deben calcularse desde estos registros. No presentes esos registros como ventas o clientes históricos de ClickTech.

Genera cuentas locales para cada rol. Documenta su acceso en un archivo de desarrollo excluido de publicación y evita una contraseña universal incorporada al código. Permite cambiarla al preparar un entorno real.

No inventes teléfono, correo, domicilio, cuenta bancaria, QR, NIT, tarifas, duración de garantías o compromisos de entrega. Agrupa esos campos en configuración y en `docs/PENDING_BUSINESS_DATA.md`, con su efecto concreto en las funciones disponibles.

## 13. Verificación y criterios de aceptación

Ejecuta compilación, comprobación de tipos, revisión estática y pruebas de los procesos críticos. Usa Playwright para los recorridos de navegador definidos en la sección 0 y pruebas de integración para concurrencia, transacciones y reglas que no se comprueben suficientemente desde la interfaz. Corrige los fallos encontrados. No declares aprobadas pruebas que no ejecutaste.

Verifica al menos estos escenarios:

1. Un visitante filtra productos, compara dos modelos y conserva el carrito al recargar.
2. Diego configura una PC según presupuesto y recibe explicación de una incompatibilidad real; un dato faltante solicita revisión.
3. Se crea un pedido con totales calculados en servidor. Cambiar el precio desde el navegador no modifica el importe cobrado.
4. Dos intentos concurrentes de reservar la última unidad no producen sobreventa ni stock negativo.
5. Subir un comprobante deja el pago pendiente. Un rol autorizado lo revisa; repetir la aprobación no duplica registros.
6. Cancelar o vencer una reserva libera sus unidades una sola vez. Prueba también el tratamiento de un pago tardío.
7. Andrea solicita mantenimiento; el técnico diagnostica y cotiza; la clienta acepta; se registra trabajo, pruebas y cierre. Un costo adicional requiere aceptación nueva.
8. Un cliente no puede leer ni descargar pedidos, comprobantes, fotos o servicios de otro modificando IDs o direcciones.
9. Una compra recibida incorpora stock una vez y un repuesto usado en servicio genera su salida vinculada.
10. Un producto desactivado conserva sus detalles en pedidos anteriores. Los reportes concuerdan con sus registros de origen.
11. La aplicación mantiene pedidos y servicios tras reiniciar. Migraciones y seed funcionan según instrucciones en un entorno limpio.
12. Inicio, catálogo, configurador, checkout y seguimiento funcionan a 360 px y en escritorio, sin contenido cortado ni acciones inaccesibles.

Revisa imágenes rotas, correspondencia entre foto y modelo, contraste, navegación, errores de consola y carga de recursos. No des por terminado el diseño si los elementos de hardware no tienen protagonismo visual.

## 14. Forma de trabajo y entrega

Empieza con una inspección breve de archivos, recursos, entorno y skills solicitadas en la sección 0. Escribe una matriz de requisitos y un plan por etapas; continúa inmediatamente con la implementación y la aplicación de las skills disponibles. Si falta un detalle no crítico, adopta una decisión reversible y documéntala. Solicita únicamente información que impida una decisión importante y avanza con el resto del trabajo.

Desarrolla la identidad y la base de datos; conecta tienda, configurador y compra; integra servicio técnico y gestión; carga imágenes y seed; verifica y pule el resultado. Mantén un archivo de avance para retomar tareas sin perder lo construido.

Entrega:

- Código fuente organizado y aplicación local ejecutable.
- Migraciones, seed y recursos visuales estables dentro del proyecto.
- `README.md` con versiones, requisitos, comandos exactos, variables y pasos para iniciar desde cero.
- `docs/REQUIREMENTS.md` con trazabilidad entre documentos, módulos y criterios de aceptación.
- `docs/DATA_MODEL.md`, `docs/ASSETS.md` y `docs/PENDING_BUSINESS_DATA.md`.
- Guías breves del cliente, administración y técnico.
- `docs/TEST_RESULTS.md` con pruebas ejecutadas, resultados y limitaciones observadas.
- `docs/SKILLS_USAGE.md` con la aplicación comprobable de Find, Taste, Impeccable, Emil Kowalski, HyperFrames y Playwright; incluye cualquier bloqueo real.
- `DESIGN.md` con el sistema visual, pruebas Playwright reproducibles y fuente editable de la pieza HyperFrames junto con su exportación y portada, si el render pudo completarse.
- Instrucciones de preparación para despliegue y copia de seguridad de base de datos y archivos. Deja claro qué integraciones requieren datos reales.

El resultado debe permitir comprar hardware, pedir orientación, cotizar una PC, solicitar soporte, conocer avances y administrar la operación desde una misma aplicación. La identidad de ClickTech debe reconocerse en toda la experiencia y cada función anunciada debe corresponder a una acción comprobable.

**Comienza ahora: inspecciona el proyecto y los recursos disponibles, descubre y prepara las skills solicitadas, define la estructura y realiza la implementación completa con revisión visual y verificación mediante Playwright.**

---

### Referencias técnicas para verificar antes de implementar

- Autenticación y autorización en Next.js: https://nextjs.org/docs/app/guides/authentication
- Transacciones en Prisma: https://www.prisma.io/docs/orm/fundamentals/transactions

Estas referencias orientan requisitos de acceso y consistencia. Ajusta la implementación a la versión estable instalada y a sus APIs documentadas.
