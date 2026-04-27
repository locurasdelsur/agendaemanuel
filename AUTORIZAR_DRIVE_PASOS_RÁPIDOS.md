# Autorizar Google Drive - Pasos Rápidos (3 minutos)

## Error que recibes

```
No cuentas con el permiso para llamar a DriveApp.getRootFolder
```

## Solución Rápida

### 1. Abre Google Apps Script
- Ve a: https://script.google.com/
- Selecciona tu proyecto

### 2. Busca el dropdown de funciones
En la barra de herramientas, verás un dropdown que dice:
```
"Select function" o un nombre de función
```

### 3. Cambia a la función de permisos
- Haz clic en el dropdown
- Busca y selecciona: `requestDrivePermission`

### 4. Ejecuta la función
- Haz clic en el botón "Run" (icono de play)

### 5. Google te pedirá permisos
- Se abrirá una ventana: "Agenda Vicedirección necesita acceso..."
- Haz clic en tu cuenta
- Haz clic en "Permitir"

### 6. ✓ Listo
Verás el mensaje: "Permisos de Google Drive otorgados correctamente"

## Ahora prueba tu app

1. Abre tu app
2. Ve a "Importar/Exportar"
3. Haz clic en "Exportar a Google Drive"
4. ✓ Debería funcionar

## Referencia Visual

```
Google Apps Script:
┌─────────────────────────────────────────┐
│ [Select function ▼]  [Run]  [Save]      │
│                                          │
│ function requestDrivePermission() {      │
│   const folder = DriveApp.getRootFolder │
│   ...                                    │
│ }                                        │
│                                          │
│ [Execution log]                          │
│ "Permisos otorgados correctamente" ✓    │
└─────────────────────────────────────────┘
```

## ¿Qué pasa?

Google Apps Script necesita que autorices una sola vez para que pueda:
- Crear carpetas en tu Drive
- Crear Google Sheets
- Mover archivos

Después, todo funciona automáticamente.

---

**Tiempo**: 3 minutos
**Frecuencia**: Una sola vez
**Permanencia**: Queda autorizado para siempre
