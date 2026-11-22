GIRLS CONQUERING THE WORLD — PROYECTO NETLIFY

QUÉ SE ACTUALIZÓ EN ESTA VERSIÓN
- Se actualizó el texto de “¿Qué somos?” y “¿Qué buscamos?” con un tono más cercano, emotivo e inspirador.
- La sección de ODS ahora presenta tres elementos numerados 1, 2 y 3, conservando la identificación correcta de los objetivos: ODS 4, ODS 5 y ODS 10.
- El panel permite editar el nombre público, la descripción y el estado de los seis distritos, tres programas y tres espacios aliados.
- Se unificaron los estados disponible, no disponible y próximamente. El mapa distingue los tres; el formulario solo permite seleccionar distritos y programas disponibles.
- Los registros tienen identificadores estables para que cambiar sus nombres públicos no rompa la relación con el registro.
- Se añadió un catálogo con búsqueda para los textos detectados mediante data-i18n y los textos guardados, además del editor visual.
- El guardado de textos se realiza por campo para evitar reemplazar otros textos que no se están editando.
- Se agregaron pruebas automatizadas básicas con Node.js.

ALMACENAMIENTO Y MIGRACIÓN
Esta versión conserva Netlify Blobs como almacenamiento activo y no elimina ni sobrescribe los datos históricos por una migración. La migración a Netlify Database/Postgres NO está activada: primero debe habilitarse y configurarse una base de datos en el proyecto Netlify. No se debe considerar verificada la persistencia en Postgres ni la migración de producción.

PRUEBAS
Ejecuta `npm test` para las pruebas automatizadas incluidas. También se verificó la sintaxis JavaScript con `node --check`.
No se ejecutó una prueba de navegador real ni pruebas de integración contra Netlify porque este entorno no tiene instalada la dependencia @netlify/blobs ni credenciales/servicios de Netlify.

CONFIGURACIÓN DE NETLIFY
Configura ADMIN_PASSWORD y SESSION_SECRET como variables privadas en Netlify. No las incluyas en el ZIP ni las compartas. Despliega el contenido completo de esta carpeta. Netlify instalará las dependencias declaradas en package.json.

ESTRUCTURA
Mantén index.html, historia.html, admin.html, admin.js, script.js, site-custom.js, styles.css, netlify.toml, package.json, netlify/ e images/ en la misma estructura.
