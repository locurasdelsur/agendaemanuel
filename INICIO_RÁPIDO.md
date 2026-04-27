# ⚡ INICIO RÁPIDO (5 MINUTOS)

## Para Implementar Ahora Mismo

### 1️⃣ Abre tu Google Apps Script
```
https://script.google.com/ → Selecciona tu proyecto
```

### 2️⃣ Copia TODO el código de `google-apps-script-v3.js`
```
Desde el archivo en la carpeta del proyecto
```

### 3️⃣ Pega en Google Apps Script
```
Reemplaza TODO lo que hay ahora
Ctrl+S para guardar
```

### 4️⃣ Ejecuta la inicialización
```
Console → Ejecuta: initializeSheets()
Espera a que termine (sin errores)
```

### 5️⃣ Publica nuevo deployment
```
Deploy → New deployment → Web app
Copia la URL nueva
```

### 6️⃣ Actualiza tu variable de entorno
```
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=NUEVA_URL_AQUÍ
```

### 7️⃣ Redeploy tu app
```
Si estás en Vercel: git push o redeploy
Si estás en v0: Publish button
```

### 8️⃣ ¡LISTO! Prueba las nuevas features
```
Abre tu app
Ve a "Importar/Exportar" → Exporta un Excel
Ve a "Historial" → Ves todos los cambios
```

---

## ✅ Verificación Rápida

En tu navegador, prueba:
```
https://tu-google-script-url/exec?action=getStats
```

Si ves JSON con estadísticas → ✅ Funciona

---

## 🆘 Si Algo Falla

Problema | Solución
---------|----------
No veo botones nuevos | Recarga con Ctrl+F5
El export no descarga | Verifica URL en variables de entorno
La importación no funciona | Verifica que Excel tenga 3 hojas exactas
No veo historial | Haz un cambio nuevo y recarga

---

## 📚 Documentación Completa

- **README_NUEVAS_FEATURES.md** - ¿Qué puedo hacer?
- **CHECKLIST_IMPLEMENTACIÓN.md** - Pasos detallados
- **SOLUCIÓN_PROBLEMAS.md** - Si algo no funciona

---

**¿Más preguntas?** Lee GUÍA_IMPLEMENTACIÓN_V3.md
