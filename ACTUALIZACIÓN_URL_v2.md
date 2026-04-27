# Actualización de URL - Google Apps Script v3.1

## Nueva URL del Deployment

```
https://script.google.com/macros/s/AKfycbw4loPKthqv--XLksxbFtJMVpf8cQjD3c73CsITFi57GuPb-p3c-6NPBPZxSCvc6F-_/exec
```

## Archivos Actualizados

✅ **app/api/proxy/route.ts**
- Línea 4: URL del script actualizada

✅ **.env.local**
- `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL` actualizada

## Funcionalidades Disponibles

El script ahora incluye:

1. **Notas** - Crear, editar, eliminar 83+ notas
2. **Recordatorios** - Con integración a Google Calendar
3. **Categorías** - Organizar por años y cursos
4. **Historial** - Auditoría completa de cambios
5. **Exportar a Excel** - Descarga en el navegador
6. **Importar desde Excel** - Carga y valida datos
7. **Exportar a Google Drive** - Guarda automáticamente en Drive
   - Crea carpeta "Agenda Vicedirección"
   - 4 hojas: Resumen, Notas, Recordatorios, Categorías
   - Fecha automática en el nombre del archivo

## Próximo Paso

**Debes desplegar tu app para que use la nueva URL:**

- **v0**: Click en "Publish"
- **GitHub + Vercel**: `git push`
- **Local**: Reinicia el servidor (`npm run dev`)

## Verificación

Después de desplegar:

1. Abre tu app
2. Ve a "Importar/Exportar"
3. Haz clic en "Exportar a Google Drive"
4. Debería crear un archivo en tu Google Drive

## Estado

- URL: ✅ Actualizada
- Proxy: ✅ Configurado
- Ambiente: ✅ Listo
- App: ⏳ Necesita desplegar

---

**Versión**: 3.1 con Google Drive
**Fecha**: 26 de Abril, 2026
**Estado**: Listo para desplegar
