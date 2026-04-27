# 🔧 Guía de Solución de Problemas

## Problema: "Las notas importadas no se guardaron"

### Causas Posibles
1. El archivo Excel no tiene exactamente 3 hojas
2. Los nombres de las hojas son incorrectos
3. Los campos no están nombrados correctamente
4. Los IDs no son únicos

### Solución

**Paso 1**: Verifica la estructura del Excel
```
Debe tener EXACTAMENTE estas 3 hojas:
✅ Notas
✅ Recordatorios
✅ Categorías

❌ NO vale: "Mis Notas", "Notes", "nota"
```

**Paso 2**: Verifica los nombres de columnas
```
Hoja "Notas" debe tener:
✅ ID
✅ Contenido
✅ Categoría
✅ Etiquetas
✅ Fecha Creación
✅ Fecha Modificación

Hoja "Recordatorios" debe tener:
✅ ID
✅ Título
✅ Categoría
✅ Fecha
✅ Hora
✅ Completado
✅ Fecha Creación
✅ Fecha Modificación

Hoja "Categorías" debe tener:
✅ ID
✅ Nombre
✅ Color
✅ Sistema
```

**Paso 3**: Verifica los IDs
```
Cada item DEBE tener un ID único:
✅ UUID válido: 123e4567-e89b-12d3-a456-426614174000
✅ UUID válido: 223e4567-e89b-12d3-a456-426614174001

❌ NO vale: "Nota 1", "id1", vacío

Si no sabes generar UUIDs, usa:
https://www.uuidgenerator.net/
```

**Paso 4**: Prueba la importación
```
1. Ve a "Importar/Exportar"
2. Sube el Excel
3. Mira el mensaje de error exacto
4. Usa ese error para corregir el Excel
```

---

## Problema: "Error durante la importación"

### Causas Posibles
1. Formato de fecha incorrecto
2. Campos vacíos obligatorios
3. Caracteres especiales problemáticos

### Solución por Tipo de Error

**Error: "Campo vacío"**
```
Cada fila DEBE tener:
- ID (no puede estar vacío)
- Contenido/Título (no puede estar vacío)
- Categoría (usa "General" si no sabes)

Si no hay dato, deja espacios en blanco pero NO vacío.
```

**Error: "Formato de fecha incorrecto"**
```
Usa EXACTAMENTE estos formatos:

Para Fecha Creación/Modificación:
✅ 2024-01-01T10:00:00.000Z (ISO 8601)
❌ NO: 2024-01-01, 01/01/2024, 1/1/24

Para Fecha de Recordatorio:
✅ 2024-01-01 (YYYY-MM-DD)
❌ NO: 01/01/2024, 1-1-2024

Para Hora:
✅ 14:00 (HH:MM en formato 24h)
❌ NO: 2:00 PM, 14h, 14.00
```

**Error: "Caracteres especiales"**
```
Algunos caracteres pueden causar problemas:
- Comillas dobles: " → usa comillas simples '
- Saltos de línea dentro de una celda → evita
- Caracteres unicode especiales → usa caracteres normales

Ejemplo bueno:
✅ La clase de 1° año

Ejemplo malo:
❌ La clase de 1º año (usa º en lugar de °)
```

---

## Problema: "El historial está vacío"

### Causas Posibles
1. La hoja "Historial" no se creó
2. No has realizado cambios después de la actualización
3. Los cambios antiguos no están registrados (solo desde v3.0)

### Solución

**Paso 1**: Verifica que la hoja existe
```
1. Abre tu Google Sheet
2. Busca la pestaña "Historial" al final
3. Si no existe, ejecuta initializeSheets() nuevamente
```

**Paso 2**: Haz un cambio nuevo
```
El historial solo registra cambios POSTERIORES a la actualización.

1. Ve a la app
2. Crea una nota nueva
3. El historial debería actualizar inmediatamente
4. Espera 5 segundos y recarga la pestaña "Historial"
```

**Paso 3**: Verifica el Google Apps Script
```
En tu script, prueba directamente:
?action=getHistory&limit=100

Deberías ver un array con cambios recientes.
```

---

## Problema: "Export genera un Excel vacío o con solo títulos"

### Causas Posibles
1. No hay datos en Google Sheets
2. Los datos están en hojas diferentes a las esperadas
3. La estructura de datos está corrupta

### Solución

**Paso 1**: Verifica que haya datos
```
1. Abre tu Google Sheet
2. Ve a la pestaña "Notas"
3. Verifica que haya filas con datos (no solo encabezados)
4. Repite para "Recordatorios" y "Categorías"
```

**Paso 2**: Estructura correcta
```
Debe verse así:

Fila 1: ID | Contenido | Categoría | ...
Fila 2: abc-123 | Mi nota | 1° Año | ...
Fila 3: def-456 | Otra nota | General | ...

Si ves:
Fila 1: ID | Contenido | ...
Fila 2: (vacío)
Fila 3: (vacío)

→ No hay datos para exportar
```

**Paso 3**: Prueba la API directamente
```
En tu navegador, visita:
?action=getNotes

Si ves un array vacío [], no hay datos.
```

---

## Problema: "No puedo descargar el Excel"

### Causas Posibles
1. URL de Google Apps Script es incorrecta
2. Variable de entorno no está actualizada
3. Problema de CORS

### Solución

**Paso 1**: Verifica la URL
```
En tu código/variables de entorno:
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=...

Abre esa URL en el navegador:
?action=getStats

Si ves un JSON con estadísticas → URL correcta
Si ves error → URL incorrecta
```

**Paso 2**: Verifica el deployment
```
En Google Apps Script:
1. Haz clic en "Deploy"
2. Ve a "Deployments"
3. Debería haber un deployment reciente
4. Copia la URL del deployment más reciente
5. Actualiza en tu variable de entorno
```

**Paso 3**: Recarga todo
```
1. Actualiza variable de entorno en Vercel
2. Redeploy tu app
3. Limpia caché del navegador (Ctrl+Shift+Del)
4. Recarga la página (Ctrl+F5)
5. Intenta descargar de nuevo
```

---

## Problema: "Veo el botón pero no pasa nada al hacer clic"

### Causas Posibles
1. JavaScript está deshabilitado
2. Consola del navegador muestra errores
3. API no responde

### Solución

**Paso 1**: Abre la consola (F12)
```
Presiona F12 en tu navegador
Ve a la pestaña "Console"
¿Hay errores en rojo?

Si hay errores, cópialolos y búscalos en RESUMEN_CAMBIOS.md
```

**Paso 2**: Verifica conectividad
```
1. Abre la consola (F12)
2. Ve a "Network" (Red)
3. Haz clic en el botón "Exportar"
4. Deberías ver una llamada a la API
5. ¿Qué estado muestra? (200, 404, 500, etc.)

Si ves 404 → URL incorrecta
Si ves 500 → Error en Google Apps Script
Si ves timeout → Script no responde
```

**Paso 3**: Prueba manualmente
```
Abre en navegador:
https://script.google.com/macros/s/YOUR_ID/exec?action=getStats

¿Ves un JSON?
✅ API funciona → problema en la app
❌ Error → problema en el script
```

---

## Problema: "Los recordatorios importados no aparecen en Google Calendar"

### Causas Posibles
1. Google Calendar no tiene permisos
2. La fecha del recordatorio está mal formateada
3. El Apps Script no tiene acceso a Calendar

### Solución

**Paso 1**: Verifica permisos de Calendar
```
En Google Apps Script:
1. Haz clic en el icono de "Project Settings"
2. Ve a la sección de "Google Cloud Project"
3. Abre el proyecto en la consola
4. Ve a APIs & Services → Enabled APIs
5. Verifica que "Google Calendar API" esté habilitada

Si no está:
1. Haz clic en "Enable APIs and Services"
2. Busca "Calendar API"
3. Haz clic en ella
4. Presiona "Enable"
```

**Paso 2**: Verifica el formato de fecha
```
El recordatorio DEBE tener:
✅ Fecha: 2024-01-15 (formato YYYY-MM-DD)
✅ Hora (opcional): 14:00 (formato HH:MM)

Si la fecha está vacía → no se crea evento
Si el formato es incorrecto → error al crear evento
```

**Paso 3**: Ejecuta manualmente
```
En Google Apps Script, prueba:

function test() {
  const result = createCalendarEvent({
    title: 'Test',
    category: 'General',
    date: '2024-01-15',
    time: '14:00'
  });
  console.log(result);
}

¿Qué devuelve? ¿Un ID o null?
- ID → funciona
- null → hay un problema
```

---

## Problema: "Veo el historial pero está incompleto"

### Causas Posibles
1. Los cambios anteriores a la actualización no están registrados
2. El historial se limpia automáticamente

### Solución

**Explicación**:
```
El historial SOLO registra cambios posteriores a la actualización a v3.0.

Los cambios realizados ANTES de actualizar no están disponibles.

Esto es normal y esperado.
```

**Si quieres histórico anterior**:
```
1. Exporta todos los datos a Excel (así tienes un backup)
2. Guarda ese Excel con fecha
3. A partir de ahora tendrás historial completo de cambios
```

---

## Problema: "Recibo un error de tipo 'CORS'"

### Causas Posibles
1. Google Apps Script no está publicado como "Web app"
2. Los permisos de acceso son incorrectos

### Solución

**Paso 1**: Verifica el deployment
```
En Google Apps Script:
1. Haz clic en "Deploy"
2. Ve a "Manage Deployments"
3. Edita el deployment activo
4. Verifica:
   - Type: Web app ✅
   - Execute as: Tu cuenta ✅
   - Who has access: Anyone ✅
```

**Paso 2**: Redeploy
```
1. Haz clic en "Deploy"
2. Selecciona "New deployment"
3. Type: Web app
4. Execute as: Tu cuenta
5. Who has access: Anyone
6. Haz clic "Deploy"
7. Copia la URL nueva
8. Actualiza en tu app
```

---

## Checklist Rápido de Diagnóstico

Cuando algo no funciona, sigue este orden:

```
1. ¿La app carga sin errores?
   ❌ Recarga (Ctrl+F5) y limpia caché
   
2. ¿Aparecen los botones de Importar/Exportar?
   ❌ Recarga la app o redeploy a Vercel
   
3. ¿La URL de Google Apps Script es correcta?
   ❌ Actualiza NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL
   
4. ¿Google Apps Script responde?
   ❌ Abre ?action=getStats en navegador
   
5. ¿Hay datos en Google Sheets?
   ❌ Crea algunos datos manualmente
   
6. ¿El Excel se descarga?
   ❌ Revisa consola (F12) para errores
   
7. ¿El Excel importado tiene datos?
   ❌ Verifica estructura (nombres de hojas y columnas)
   
8. ¿Se ven cambios en el historial?
   ❌ Crea un cambio nuevo y recarga historial
```

---

**Si nada funciona**: Ejecuta `initializeSheets()` nuevamente en la consola de Google Apps Script.

**Última actualización**: Abril 2026
