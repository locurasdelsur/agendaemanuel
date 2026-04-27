# Exportar 83 Notas a Google Drive

## ¿Qué hace?

Ahora puedes exportar todas tus 83 notas (junto con recordatorios y categorías) directamente a **Google Drive** en un archivo Excel.

## Nuevas Características

### 1. **Botón "Exportar a Google Drive"**
- Ubicado en la pestaña "Importar/Exportar"
- Guarda automáticamente un archivo en Google Drive
- Crea una carpeta "Agenda Vicedirección" si no existe
- El archivo incluye:
  - ✓ Todas las notas (83)
  - ✓ Todos los recordatorios
  - ✓ Todas las categorías
  - ✓ Resumen estadístico

### 2. **Archivos Creados en Drive**
- Se guardan con formato: `Agenda_Vicedirección_YYYY-MM-DD`
- Automáticamente en una carpeta "Agenda Vicedirección"
- Puedes descargarlos después si los necesitas

## Implementación (IMPORTANTE)

### Paso 1: Abrir Google Apps Script

1. Ve a https://script.google.com/
2. Selecciona tu proyecto actual
3. Abre el editor

### Paso 2: Agregar las funciones

En tu script, **antes de la última línea de cierre `}`**, agrega estas funciones:

```javascript
// COPIAR Y PEGAR TODO ESTO EN TU SCRIPT
// Colócalo después de la función getStats() y antes del último }

/**
 * Exporta todas las notas a Google Drive
 */
function exportNotesToDriveAdvanced() {
  try {
    const notes = getNotes();
    const reminders = getReminders();
    const categories = getCategories();
    const timestamp = new Date();
    
    const fileName = `Agenda_Vicedirección_${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
    
    let targetFolder = null;
    const folders = DriveApp.getRootFolder().getFoldersByName('Agenda Vicedirección');
    
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = DriveApp.getRootFolder().createFolder('Agenda Vicedirección');
    }
    
    const spreadsheet = SpreadsheetApp.create(fileName);
    const ss = spreadsheet;
    
    // Hoja 1: Resumen
    const summarySheet = ss.getActiveSheet();
    summarySheet.setName('Resumen');
    summarySheet.appendRow(['Resumen de Exportación']);
    summarySheet.appendRow(['']);
    summarySheet.appendRow(['Total de Notas:', notes.length]);
    summarySheet.appendRow(['Total de Recordatorios:', reminders.length]);
    summarySheet.appendRow(['Recordatorios Completados:', reminders.filter(r => r.completed).length]);
    summarySheet.appendRow(['Recordatorios Pendientes:', reminders.filter(r => !r.completed).length]);
    summarySheet.appendRow(['Total de Categorías:', categories.length]);
    summarySheet.appendRow(['']);
    summarySheet.appendRow(['Fecha de Exportación:', timestamp.toLocaleString('es-AR')]);
    summarySheet.appendRow(['URL del Google Sheet:', spreadsheet.getUrl()]);
    
    summarySheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
    summarySheet.autoResizeColumns(1, 2);
    
    // Hoja 2: Notas
    const notesSheet = ss.insertSheet('Notas');
    notesSheet.appendRow(['ID', 'Contenido', 'Categoría', 'Etiquetas', 'Fecha Creación', 'Fecha Modificación']);
    notesSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#2d5016').setFontColor('#ffffff');
    
    notes.forEach(note => {
      const tags = Array.isArray(note.tags) ? note.tags.join(', ') : note.tags;
      notesSheet.appendRow([note.id, note.content, note.category, tags, note.createdAt, note.updatedAt]);
    });
    
    // Hoja 3: Recordatorios
    const remindersSheet = ss.insertSheet('Recordatorios');
    remindersSheet.appendRow(['ID', 'Título', 'Categoría', 'Fecha', 'Hora', 'Completado', 'Fecha Creación', 'Fecha Modificación']);
    remindersSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#2d5016').setFontColor('#ffffff');
    
    reminders.forEach(reminder => {
      const completed = reminder.completed ? 'Sí' : 'No';
      remindersSheet.appendRow([reminder.id, reminder.title, reminder.category, reminder.date, reminder.time, completed, reminder.createdAt, reminder.updatedAt]);
    });
    
    // Hoja 4: Categorías
    const categoriesSheet = ss.insertSheet('Categorías');
    categoriesSheet.appendRow(['ID', 'Nombre', 'Color', 'Es Sistema']);
    categoriesSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#2d5016').setFontColor('#ffffff');
    
    categories.forEach(category => {
      const isSystem = category.isSystem ? 'Sí' : 'No';
      categoriesSheet.appendRow([category.id, category.name, category.color, isSystem]);
    });
    
    // Mover a carpeta
    const file = DriveApp.getFileById(spreadsheet.getId());
    const oldParents = file.getParents();
    while (oldParents.hasNext()) {
      oldParents.next().removeFile(file);
    }
    targetFolder.addFile(file);
    
    // Registrar en historial
    addToHistory('export', 'drive_advanced', 'export_to_drive_advanced', 'google_sheet', null, fileName, `${notes.length} notas + ${reminders.length} recordatorios exportados a Google Drive`);
    
    return {
      success: true,
      message: `Datos exportados correctamente a Google Drive`,
      fileName: fileName,
      fileId: spreadsheet.getId(),
      fileUrl: spreadsheet.getUrl(),
      statistics: {
        totalNotes: notes.length,
        totalReminders: reminders.length,
        completedReminders: reminders.filter(r => r.completed).length,
        pendingReminders: reminders.filter(r => !r.completed).length,
        totalCategories: categories.length
      },
      timestamp: timestamp.toISOString()
    };
  } catch (error) {
    Logger.log('Error exportando a Drive: ' + error.toString());
    return {
      error: 'Error al exportar a Drive: ' + error.toString()
    };
  }
}
```

### Paso 3: Agregar el caso al switch

En la función `handleRequest()`, dentro del `switch(action)`, agrega este caso:

```javascript
case 'exportNotesToDriveAdvanced':
  result = exportNotesToDriveAdvanced();
  break;
```

**Ubicación exacta:**
```javascript
switch (action) {
  // ... casos anteriores ...
  
  case 'getStats':
    result = getStats();
    break;
  
  // AGREGAR AQUÍ:
  case 'exportNotesToDriveAdvanced':
    result = exportNotesToDriveAdvanced();
    break;
  
  // ... casos posteriores ...
}
```

### Paso 4: Guardar y Publicar

1. **Guarda** el script (Ctrl+S)
2. **Deploy** → New deployment → Web app
3. Espera a que se publique

### Paso 5: Probar en tu App

1. Abre tu app
2. Ve a pestaña "Importar/Exportar"
3. Haz clic en botón **"Exportar a Google Drive"**
4. ¡Listo! Un archivo aparecerá en Google Drive

## ¿Dónde está el archivo?

Los archivos se guardan en:
```
Google Drive > Agenda Vicedirección > Agenda_Vicedirección_YYYY-MM-DD
```

## Contenido del archivo

El archivo contiene 4 hojas:

1. **Resumen** - Estadísticas totales
2. **Notas** - Todas tus 83 notas con detalles
3. **Recordatorios** - Todos los recordatorios
4. **Categorías** - Todas las categorías

## Novedades en la UI

- ✓ Nuevo botón "Exportar a Google Drive"
- ✓ Icono de nube (Cloud)
- ✓ Junto al botón de Excel
- ✓ Muestra cuántas notas tienes (83)

## Ventajas

- ✓ Backup automático en Google Drive
- ✓ Editable desde Drive
- ✓ Compartible con colegas
- ✓ Historial de exportaciones
- ✓ Todo en Google Sheets (no solo Excel)

## Troubleshooting

### "Error: No tienes permiso"
- Asegúrate de estar logueado en tu cuenta de Google
- Google Apps Script debe tener acceso a Drive

### "Error: Función no existe"
- Verifica que copiaste TODO el código
- Asegúrate de agregar el `case` al switch
- Guarda y vuelve a publicar

### "El archivo no aparece en Drive"
- Recarga Google Drive (F5)
- Busca la carpeta "Agenda Vicedirección"
- Verifica los permisos de tu cuenta

## Próximos pasos

1. Implementa las funciones en Google Apps Script
2. Publica el nuevo deployment
3. Prueba el botón en tu app
4. ¡Disfruta del backup automático!

---

**Estado:** ✅ Listo para implementar
**Complejidad:** Fácil (solo copiar y pegar)
**Tiempo:** 5 minutos
