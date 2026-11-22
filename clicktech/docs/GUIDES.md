# Guías Breves de Operación — ClickTech

## 1. Guía del Cliente
1. **Explorar y comparar:** Usa `/catalogo` para buscar por nombre, marca, modelo o SKU, filtrar por precio en Bs, socket, generación RAM y stock disponible. Usa el botón **Comparar** para contrastar de 2 a 4 modelos de una misma categoría.
2. **Armar PC según presupuesto (`/arma-tu-pc`):** Ingresa tu presupuesto en Bs y uso principal, pulsa **Proponer por presupuesto** y revisa el veredicto de compatibilidad y el plan de mejoras por etapas. Puedes guardar/compartir la configuración, solicitar revisión técnica o llevar los componentes al carrito.
3. **Comprar y subir comprobante (`/checkout` y `/pedido/[id]`):** Selecciona recojo coordinado o entrega en zona configurada de Potosí. Tras confirmar, descarga tu comprobante operativo y sube la referencia o imagen de transferencia para revisión manual.
4. **Servicio técnico y seguimiento (`/servicios` y `/seguimiento`):** Registra tu equipo sin ingresar contraseñas de sistema, consulta la línea de tiempo con tu código `ST-...`, aprueba o rechaza las cotizaciones versionadas desde tu cuenta y revisa las pruebas de cierre.

## 2. Guía de Ventas y Atención (`SALES` / `ADMIN`)
1. Inicia sesión en `/login` con tu cuenta asignada (ver `.dev-credentials.local` en entorno local) para acceder a `/admin`.
2. **Pagos:** Revisa en la pestaña **Pagos** los comprobantes privados enviados por clientes. Aprueba únicamente tras verificar el ingreso real; si la reserva venció (`Envío tardío`), el sistema revalidará el stock automáticamente antes de confirmar.
3. **Pedidos, Compras e Inventario:** Gestiona recepciones parciales o totales en **Compras** (el stock aumenta al recibir físicamente), libera reservas vencidas en **Inventario** y avanza la preparación/entrega en **Pedidos**.
4. **Cotizaciones y B2B:** Atiende configuraciones enviadas a revisión técnica y solicitudes corporativas de `/empresas`.

## 3. Guía del Técnico (`TECH`)
1. Inicia sesión en `/login` con la cuenta `TECH` para acceder directamente a la consola de **Servicio Técnico** en `/admin`.
2. Registra el estado físico inicial, número de serie, accesorios recibidos y diagnóstico técnico. Las **notas internas** quedan ocultas automáticamente para el cliente.
3. Si necesitas un repuesto del inventario, asígnalo desde **+ Asignar repuesto** (descuenta stock y registra movimiento `SERVICE_PART_USED`).
4. Si el costo varía, emite una nueva versión de cotización (**Enviar cotización al cliente**); el sistema impedirá avanzar a **En proceso** o **Entregado** mientras el cliente no acepte esa versión.
5. Para entregar (`Entregado`), registra el resumen final y las pruebas técnicas realmente ejecutadas.
