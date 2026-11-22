# Matriz de Requisitos y Trazabilidad — ClickTech

## 1. Trazabilidad Documental (Actividades 2, 4, 5 y Presentación de Marca)

| Fuente documental | Requisito clave | Módulo / Implementación en ClickTech |
| --- | --- | --- |
| **Actividad 2** | Comercio electrónico B2C/B2B, catálogo de PCs/laptops/componentes/periféricos, diagnóstico, mantenimiento, reparación, actualización, ensamblaje, gestión propia (clientes, compras, inventario, proveedores, garantías, órdenes técnicas y reportes). | Tienda (`/`, `/catalogo`, `/producto/[slug]`), Servicios (`/servicios`, `/seguimiento`), Empresas (`/empresas`) y Panel de Gestión (`/admin` con 12 módulos respaldados por PostgreSQL/Prisma). |
| **Actividad 4** | Fuentes de ingreso diversificadas: venta de hardware, servicios técnicos, actualizaciones, ensamblaje personalizado y soporte B2B sin depender de una sola línea. | Carrito/Checkout con ensamblaje opcional, catálogo de 7 servicios configurables, flujo de repuestos en taller (`ServiceOrderPart`) y solicitudes B2B (`/empresas`). |
| **Actividad 5** | Prioridad gamer (16–35 años) sin excluir a estudiantes, profesionales ni PyMEs; 4 puntos de dolor (presupuesto limitado, lentitud/fallas, piezas incompatibles, desconfianza/cargos ocultos); recorrido **Escuchar → Proponer → Resolver → Acompañar**. | Hero y tarjetas del recorrido en Inicio (`/`), Configurador y Asesor por presupuesto (`/arma-tu-pc`) con mejoras por etapas, reglas verificables de compatibilidad y revisión técnica, cotizaciones versionadas con aceptación explícita y seguimiento en vivo. |
| **Presentación de Marca** | Logo original (`logo_user_overlay.png` / `clicktech_logo_original.jpg`), lemas «Tecnología a tu medida» y «Más que tecnología, es tu pasión», paleta `#00E5FF`, `#8B5CF6`, `#02040A`, `#FFFFFF` y tipografía angular tecnológica. | `public/brand/logo_trimmed.png`, `src/app/globals.css` (`Orbitron` + `Space Grotesk` + `Plus Jakarta Sans`), pieza audiovisual `brand-video/` integrada en hero; exclusión deliberada de frases absolutas no verificadas («100 %», «primera marca», «cero fallas»). |

## 2. Matriz de Criterios de Aceptación (Sección 13 del Prompt)

| # | Criterio de Aceptación | Verificación Implementada |
| --- | --- | --- |
| 1 | Visitante filtra productos, compara 2 modelos y conserva el carrito al recargar. | Playwright `clicktech.spec.ts` #1 + `Cart` persistido en PostgreSQL vía cookie HTTP-only. |
| 2 | Diego configura PC por presupuesto y recibe explicación de incompatibilidad real y de dato faltante (`Requiere revisión técnica`). | Vitest `business-rules.test.ts` #1 + Playwright `clicktech.spec.ts` #2. |
| 3 | Pedido calculado en servidor; manipular precio en navegador no altera el total. | `createOrderTransactional` ignora precios del cliente y consulta BD; Vitest #2 + Playwright #3. |
| 4 | Dos intentos concurrentes sobre la última unidad no producen sobreventa ni stock negativo. | Actualización SQL atómica condicionada `("stockOnHand" - "stockReserved") >= qty`; Vitest #2 con `Promise.allSettled`. |
| 5 | Subir comprobante deja pago pendiente; aprobación idempotente no duplica movimientos. | `submitPaymentProofTransactional` + `reviewPaymentTransactional` con lock atómico de estado e `idempotencyKey`; Vitest #2 + Playwright #3. |
| 6 | Cancelar o vencer reserva libera unidades una vez; pago tardío revalida stock. | `cancelOrderTransactional` + `releaseExpiredReservations` + chequeo de stock en pago tardío; Vitest #3. |
| 7 | Andrea solicita mantenimiento, técnico diagnostica y cotiza, clienta acepta, trabajo/pruebas/cierre; costo extra exige nueva aceptación. | `service-orders.ts` bloquea `IN_PROGRESS` / `DELIVERED` si `totalApprovedCents < labor + parts`; Vitest #4 + Playwright #4. |
| 8 | Cliente no accede ni descarga pedidos, comprobantes, fotos o servicios de otro ni notas internas. | `authorizeOrderAccess`, `/api/private-files/[...path]`, proyección explícita en `seguimiento/[ticketNumber]` y Playwright #4. |
| 9 | Compra recibida suma stock una vez; repuesto en servicio genera salida vinculada. | `receivePurchaseOrderTransactional` + `addServiceOrderPartTransactional`; Vitest #4. |
| 10 | Producto desactivado conserva detalles en pedidos previos; reportes concuerdan con origen. | `OrderItem` almacena `skuSnapshot`, `productNameSnapshot`, `unitPriceCentsSnapshot`, `unitCostCentsSnapshot`; Vitest #5. |
| 11 | Persistencia tras reinicio; migraciones y seed limpios en PostgreSQL. | PostgreSQL 18 + `prisma migrate` + `db:seed` idempotente. |
| 12 | Inicio, catálogo, configurador, checkout y seguimiento operan en 360 px y escritorio sin desbordamiento. | Playwright `clicktech.spec.ts` #5 verificando `360`, `768`, `1024` y `1440` px + `reduced-motion`. |
