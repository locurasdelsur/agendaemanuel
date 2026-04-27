# Guía de Implementación - Agenda Vicedirección V3.0

## Cambios Principales

✅ **Importación/Exportación en Excel**
- Exporta todos tus datos (Notas, Recordatorios, Categorías, Historial) a un archivo Excel con múltiples hojas
- Importa datos desde un archivo Excel y los guarda automáticamente en la base de datos
- Todos los items importados quedan registrados en el historial

✅ **Historial de Cambios Completo**
- Cada cambio se registra automáticamente con timestamp
- Puedes ver qué se modificó, cuándo y qué valores anteriores tenía
- La vista de historial es accesible desde la app web

✅ **Google Apps Script Mejorado**
- Manejo correcto de importaciones
- Validación de datos
- Almacenamiento permanente en historial

---

## Pasos de Implementación

### 1. Actualizar Google Apps Script

1. Ve a tu Google Apps Script: https://script.google.com/
2. Abre tu proyecto existente
3. **Reemplaza COMPLETAMENTE** el contenido con el código de `google-apps-script-v3.js`
4. Guarda el proyecto (Ctrl+S)
5. Ejecuta la función `initializeSheets()` desde la consola
6. Publica nuevamente (Deploy → New deployment)

### 2. Copiar la URL actualizada

Después de publicar, copia la nueva URL de tu Google Apps Script.

### 3. Actualizar variables de entorno

En tu proyecto (o en Settings → Vars):

```
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 4. Instalar dependencias

```bash
pnpm install xlsx
```

**NOTA:** Ya lo hemos hecho, pero si clonas en otra máquina:

```bash
pnpm install
```

### 5. Implementar en producción

Despliega tu app a Vercel con los cambios.

---

## Nuevas Características

### Exportar a Excel

1. Ve a la pestaña **"Importar/Exportar"**
2. Haz clic en **"Exportar a Excel"**
3. Se descargará un archivo `Agenda_Vicedirección_YYYY-MM-DD.xlsx`

El archivo contiene 4 hojas:
- **Notas** - Todas tus notas con categoría, etiquetas, fechas
- **Recordatorios** - Todos tus recordatorios con estado de completado
- **Categorías** - Listado de todas las categorías
- **Historial** - Registro completo de todos los cambios

### Importar desde Excel

1. Prepara un archivo Excel con la estructura correcta
2. Ve a la pestaña **"Importar/Exportar"**
3. Haz clic en **"Importar desde Excel"**
4. Selecciona tu archivo
5. Los datos se importarán automáticamente

**Importante:** Solo se importan items que no existen (por ID). Los duplicados se ignoran.

### Ver Historial

1. Ve a la pestaña **"Historial"**
2. Verás un registro de todos los cambios realizados:
   - **Crear** - Cuando se creó un nuevo item
   - **Actualizar** - Cuando se modificó un campo
   - **Eliminar** - Cuando se eliminó un item
   - **Importar** - Cuando se importó desde Excel
   - **Completar** - Cuando se marcó un recordatorio como completo

Cada cambio muestra:
- Timestamp exacto
- Tipo de item (nota, recordatorio, categoría)
- Campo que cambió
- Valor anterior y nuevo
- Detalles adicionales

---

## Formato de Excel para Importar

Si quieres crear tu propio archivo Excel para importar, sigue esta estructura:

### Hoja "Notas"
| ID | Contenido | Categoría | Etiquetas | Fecha Creación | Fecha Modificación |
|---|---|---|---|---|---|
| uuid | Mi nota | 1° Año | tag1, tag2 | 2024-01-01T10:00:00.000Z | 2024-01-01T10:00:00.000Z |

### Hoja "Recordatorios"
| ID | Título | Categoría | Fecha | Hora | Completado | Fecha Creación | Fecha Modificación |
|---|---|---|---|---|---|---|---|
| uuid | Mi recordatorio | 1° Año | 2024-01-01 | 10:00 | No | 2024-01-01T10:00:00.000Z | 2024-01-01T10:00:00.000Z |

### Hoja "Categorías"
| ID | Nombre | Color | Sistema |
|---|---|---|---|
| uuid | Nueva Categoría | #ff0000 | No |

---

## Troubleshooting

**P: Mi exportación no muestra todos los datos**
R: Asegúrate de que la función `exportAll` esté funcionando. Prueba:
```
?action=exportAll
```

**P: La importación no importa nada**
R: Verifica que:
1. El archivo Excel tenga las hojas exactas: "Notas", "Recordatorios", "Categorías"
2. Las columnas tengan los nombres exactos (respeta mayúsculas)
3. Todos los items importados tengan un ID único

**P: No veo el historial**
R: El historial se genera a partir de ahora. Los cambios históricos anteriores a esta versión no están registrados.

**P: El archivo Excel importado dice "0 items agregados"**
R: Probablemente ya existen items con los mismos IDs. Cambia los IDs en Excel a valores únicos.

---

## Archivos Modificados

- `google-apps-script-v3.js` - Script actualizado (cópialo manualmente en Google Apps Script)
- `components/import-export.tsx` - Nuevo componente para importar/exportar
- `components/history-view.tsx` - Nuevo componente para ver el historial
- `components/main-content.tsx` - Actualizado con nuevas pestañas
- `package.json` - Añadida dependencia `xlsx`

---

## Próximas Mejoras Posibles

- [ ] Descargar historial como CSV
- [ ] Filtrar historial por rango de fechas
- [ ] Restaurar versión anterior de un item
- [ ] Backup automático diario
- [ ] Sincronización bidireccional con Google Drive

---

**¿Preguntas o problemas?** Contacta al soporte técnico.
