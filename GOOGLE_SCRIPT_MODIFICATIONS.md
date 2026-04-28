# Modificaciones Necesarias al Google Apps Script

## Objetivo
Agregar un campo `parentId` a la tabla de categorías para indicar si una categoría es principal o subcategoría.

## Estructura Esperada

Tu tabla de categorías en Google Sheets debe tener estas columnas:
- **ID** - Identificador único
- **Nombre** - Nombre de la categoría
- **Color** - Color hex (ej: #22c55e)
- **Es Sistema** - TRUE/FALSE (ya existe)
- **parentId** - (NUEVA COLUMNA) ID de la categoría padre, dejar vacío para categorías principales

## Ejemplo de Datos

| ID | Nombre | Color | Es Sistema | parentId |
|---|---|---|---|---|
| cat-1 | 1° Año | #22c55e | TRUE | |
| cat-2 | 2° Año | #3b82f6 | TRUE | |
| cat-3 | 3° Año | #f59e0b | TRUE | |
| cat-4 | 3° 5ta | #ec4899 | FALSE | cat-3 |
| cat-5 | 4° Año | #ef4444 | TRUE | |
| cat-6 | 5° Año | #a855f7 | TRUE | |
| cat-7 | 6° Año | #06b6d4 | TRUE | |
| cat-8 | 7° Año | #10b981 | TRUE | |
| cat-9 | General | #6b7280 | TRUE | |

## Cambios en el Google Apps Script

En la función que retorna las categorías, agrega el campo `parentId`:

```javascript
function doGet(e) {
  var action = e.parameter.action || 'getAll';
  
  if (action === 'getCategories') {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Categorías');
    var data = sheet.getDataRange().getValues();
    
    var categories = [];
    for (var i = 1; i < data.length; i++) { // Skip header
      if (data[i][0]) { // If ID exists
        categories.push({
          id: data[i][0],
          name: data[i][1],
          color: data[i][2],
          esSistema: data[i][3],
          parentId: data[i][4] || null  // Column 5 (index 4)
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(categories))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... resto del código
}
```

## Instrucciones Paso a Paso

1. **Abre tu Google Sheet** donde tienes las categorías
2. **Agrega una columna nueva** llamada "parentId" después de "Es Sistema"
3. **Para las categorías principales** (1° Año, 2° Año, etc.) deja el parentId vacío
4. **Para las subcategorías** (como "3° 5ta") coloca el ID de la categoría padre en esta columna
5. **Actualiza tu Google Apps Script** con el código proporcionado arriba
6. **Publica el script** nuevamente

## Resultado

Una vez hecho esto, la app cargará automáticamente:
- Las 7 categorías principales (1° Año a 7° Año) y General
- Las subcategorías apareceran indentadas bajo sus categorías padre
- La sincronización en tiempo real mantendrá todo actualizado
