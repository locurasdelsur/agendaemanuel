# Ejemplo: Cómo Importar Datos desde Excel

## Escenario

Tienes datos en un archivo Excel y quieres importarlos a tu Agenda Vicedirección.

## Paso a Paso

### 1. Prepara tu archivo Excel

Abre Excel y crea 3 hojas (pestañas) con esta estructura:

#### Hoja 1: "Notas"

```
ID | Contenido | Categoría | Etiquetas | Fecha Creación | Fecha Modificación
123e4567-e89b-12d3-a456-426614174000 | Revisar tareas de 1° año | 1° Año | importante, matemática | 2024-01-01T10:00:00.000Z | 2024-01-01T10:00:00.000Z
223e4567-e89b-12d3-a456-426614174001 | Preparar examen de química | 2° Año | química, urgente | 2024-01-02T11:00:00.000Z | 2024-01-02T11:00:00.000Z
```

#### Hoja 2: "Recordatorios"

```
ID | Título | Categoría | Fecha | Hora | Completado | Fecha Creación | Fecha Modificación
323e4567-e89b-12d3-a456-426614174002 | Reunión con directora | General | 2024-01-15 | 14:00 | No | 2024-01-10T09:00:00.000Z | 2024-01-10T09:00:00.000Z
423e4567-e89b-12d3-a456-426614174003 | Entregar calificaciones | 3° Año | 2024-01-20 | 16:30 | No | 2024-01-10T09:00:00.000Z | 2024-01-10T09:00:00.000Z
```

#### Hoja 3: "Categorías"

```
ID | Nombre | Color | Sistema
523e4567-e89b-12d3-a456-426614174004 | Urgente | #ef4444 | No
623e4567-e89b-12d3-a456-426614174005 | Importante | #f59e0b | No
```

### 2. Guarda el archivo

Guarda tu archivo como: `Mi_Datos_Agenda.xlsx`

### 3. Abre la App

Ve a tu aplicación Agenda Vicedirección en el navegador.

### 4. Ve a "Importar/Exportar"

Haz clic en la pestaña "Importar/Exportar"

### 5. Importa el archivo

Haz clic en "Importar desde Excel" y selecciona tu archivo.

### 6. Verifica

Deberías ver un mensaje como:
```
6 items importados correctamente.
```

Y luego los datos aparecerán en tu app.

### 7. Revisa el Historial

Ve a la pestaña "Historial" para ver que todas tus importaciones quedan registradas con:
- Fecha y hora exacta
- Tipo de item
- Acción (import)
- Detalles

---

## Notas Importantes

⚠️ **IDs Únicos**: Cada item debe tener un ID único. Si importas algo con un ID que ya existe, se ignorará.

⚠️ **Nombres de Hojas**: Las hojas DEBEN llamarse exactamente:
- "Notas"
- "Recordatorios" 
- "Categorías"

⚠️ **Nombres de Columnas**: Deben ser exactamente como se muestra (respetando mayúsculas).

⚠️ **Formato de Fechas**: 
- Fechas de creación/modificación: `YYYY-MM-DDTHH:MM:SS.000Z` (ISO 8601)
- Fechas de recordatorios: `YYYY-MM-DD` (ej: 2024-01-15)
- Horas: `HH:MM` (ej: 14:00)

✅ **Completado**: Para recordatorios, use "Sí" o "No"

✅ **Sistema**: Para categorías, use "Sí" o "No"

---

## Generador de UUIDs

Si necesitas generar IDs únicos, usa:
- https://www.uuidgenerator.net/
- O copia los de tu último export

---

## Preguntas Frecuentes

**P: ¿Perderé mis datos si importo?**
R: No. Los datos que importas se AGREGAN a los existentes. No se elimina nada.

**P: ¿Puedo importar varias veces?**
R: Sí, pero solo importarán items con IDs nuevos. Los duplicados se ignorarán.

**P: ¿Qué pasa si el archivo está mal formateado?**
R: Verás un mensaje de error. Revisa que:
1. Todas las hojas existan y se llamen correctamente
2. Todos los campos estén completos
3. No haya filas vacías en el medio

**P: ¿Se crea automáticamente el evento de calendario?**
R: Sí. Cuando importas un recordatorio con fecha, se crea el evento en Google Calendar automáticamente.
