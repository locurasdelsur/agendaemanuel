# Solución: Permisos de Google Drive

## El Problema

Google Apps Script necesita permiso explícito para acceder a Google Drive.

Error:
```
No cuentas con el permiso para llamar a DriveApp.getRootFolder. 
Permisos necesarios: https://www.googleapis.com/auth/drive
```

## Solución (5 minutos)

### Paso 1: Agregar función de autorización

En tu Google Apps Script, ANTES de la función `exportNotesToDriveAdvanced()`, agregar esta función:

```javascript
/**
 * Función para solicitar permisos a Google Drive
 * Ejecuta esta función UNA VEZ en Google Apps Script
 */
function requestDrivePermission() {
  try {
    // Esta línea solicita permisos
    const folder = DriveApp.getRootFolder();
    return {
      success: true,
      message: 'Permisos de Google Drive otorgados correctamente',
      folderId: folder.getId()
    };
  } catch (error) {
    return {
      error: 'Error al solicitar permisos: ' + error.toString()
    };
  }
}
```

### Paso 2: Ejecutar la función en Google Apps Script

1. Abre tu Google Apps Script: https://script.google.com/
2. Selecciona tu proyecto
3. En el editor, busca el dropdown donde dice "Select function"
4. Cambia a `requestDrivePermission` (la nueva función)
5. Haz clic en el botón "Run" (play)
6. Google te pedirá permisos - **HACES CLIC EN AUTORIZAR**

### Paso 3: Autorizar el script

Se abrirá una ventana diciendo:
```
"Agenda Vicedirección necesita acceso a tu cuenta de Google"
```

- Haz clic en tu cuenta
- Haz clic en "Permitir"
- Verás un mensaje: "Permisos de Google Drive otorgados correctamente"

### Paso 4: Listo

Ahora puedes usar "Exportar a Google Drive" en tu app sin problemas.

## Verificación

Después de autorizar:

1. Abre tu app
2. Ve a "Importar/Exportar"
3. Haz clic en "Exportar a Google Drive"
4. ✓ Debería funcionar sin errores

## Si aún hay problemas

### Opción A: Ejecutar desde Google Apps Script

En lugar de desde tu app, ejecuta directamente en Google Apps Script:

1. En Google Apps Script, dropdown: `exportNotesToDriveAdvanced`
2. Click "Run"
3. Verás la URL del archivo creado

### Opción B: Verificar permisos

En Google Apps Script:
1. Project Settings (engranaje)
2. Verifica que tienes acceso a Drive

### Opción C: Crear nuevo deployment

Si ya autorizaste pero aún hay error:

1. Deploy → Manage Deployments
2. Click en el deployment actual
3. Click en "Delete"
4. Crea un nuevo deployment (Deploy → New deployment)
5. Vuelve a intentar

## Detalles Técnicos

Google Apps Script necesita estos permisos:
- `https://www.googleapis.com/auth/drive` - Acceso a Google Drive

Se solicita automáticamente cuando:
- Llamas a `DriveApp.getRootFolder()`
- Llamadas a otras funciones de Drive

## Solución Permanente

Después de hacer esto UNA VEZ, todos los usuarios que usen tu app podrán:
- Exportar a Drive sin problemas
- Crear archivos automáticamente
- Guardar backups en Drive

---

**Estado**: Solución rápida y fácil
**Tiempo**: 5 minutos
**Permanencia**: Se hace una sola vez
