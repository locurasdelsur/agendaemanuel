'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, Cloud } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportExportProps {
  onImportSuccess?: () => void;
}

export function ImportExport({ onImportSuccess }: ImportExportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;

  const handleExport = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}?action=exportAll`);
      const result = await response.json();

      if (result.success && result.data) {
        // Crear workbook con múltiples hojas
        const wb = XLSX.utils.book_new();

        // Hoja de Notas
        if (result.data.notes && result.data.notes.length > 0) {
          const notesData = result.data.notes.map((note: any) => ({
            ID: note.id,
            Contenido: note.content,
            Categoría: note.category,
            Etiquetas: Array.isArray(note.tags) ? note.tags.join(', ') : note.tags,
            'Fecha Creación': note.createdAt,
            'Fecha Modificación': note.updatedAt
          }));
          const notesSheet = XLSX.utils.json_to_sheet(notesData);
          XLSX.utils.book_append_sheet(wb, notesSheet, 'Notas');
        }

        // Hoja de Recordatorios
        if (result.data.reminders && result.data.reminders.length > 0) {
          const remindersData = result.data.reminders.map((reminder: any) => ({
            ID: reminder.id,
            Título: reminder.title,
            Categoría: reminder.category,
            Fecha: reminder.date,
            Hora: reminder.time,
            Completado: reminder.completed ? 'Sí' : 'No',
            'Fecha Creación': reminder.createdAt,
            'Fecha Modificación': reminder.updatedAt
          }));
          const remindersSheet = XLSX.utils.json_to_sheet(remindersData);
          XLSX.utils.book_append_sheet(wb, remindersSheet, 'Recordatorios');
        }

        // Hoja de Categorías
        if (result.data.categories && result.data.categories.length > 0) {
          const categoriesData = result.data.categories.map((category: any) => ({
            ID: category.id,
            Nombre: category.name,
            Color: category.color,
            'Sistema': category.isSystem ? 'Sí' : 'No'
          }));
          const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
          XLSX.utils.book_append_sheet(wb, categoriesSheet, 'Categorías');
        }

        // Hoja de Historial
        if (result.data.history && result.data.history.length > 0) {
          const historyData = result.data.history.map((record: any) => ({
            Timestamp: record.timestamp,
            Tipo: record.type,
            'ID Item': record.itemId,
            Acción: record.action,
            'Campo Modificado': record.fieldModified,
            'Valor Anterior': record.oldValue ? JSON.stringify(record.oldValue) : '',
            'Valor Nuevo': record.newValue ? JSON.stringify(record.newValue) : '',
            Detalles: record.details
          }));
          const historySheet = XLSX.utils.json_to_sheet(historyData);
          XLSX.utils.book_append_sheet(wb, historySheet, 'Historial');
        }

        // Descargar archivo
        const fileName = `Agenda_Vicedirección_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        setMessage({ type: 'success', text: 'Datos exportados correctamente' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al exportar datos' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToDrive = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}?action=exportNotesToDriveAdvanced`);
      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `${result.statistics.totalNotes} notas exportadas a Google Drive. Abre el archivo: ${result.fileName}`
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al exportar a Drive' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });

      const importData: any = {
        notes: [],
        reminders: [],
        categories: []
      };

      // Leer Notas
      if (wb.SheetNames.includes('Notas')) {
        const notesSheet = XLSX.utils.sheet_to_json(wb.Sheets['Notas']);
        importData.notes = notesSheet.map((row: any) => ({
          id: row.ID,
          content: row.Contenido,
          category: row.Categoría,
          tags: row.Etiquetas ? row.Etiquetas.split(',').map((t: string) => t.trim()) : [],
          createdAt: row['Fecha Creación'],
          updatedAt: row['Fecha Modificación']
        }));
      }

      // Leer Recordatorios
      if (wb.SheetNames.includes('Recordatorios')) {
        const remindersSheet = XLSX.utils.sheet_to_json(wb.Sheets['Recordatorios']);
        importData.reminders = remindersSheet.map((row: any) => ({
          id: row.ID,
          title: row.Título,
          category: row.Categoría,
          date: row.Fecha,
          time: row.Hora,
          completed: row.Completado === 'Sí',
          createdAt: row['Fecha Creación'],
          updatedAt: row['Fecha Modificación']
        }));
      }

      // Leer Categorías
      if (wb.SheetNames.includes('Categorías')) {
        const categoriesSheet = XLSX.utils.sheet_to_json(wb.Sheets['Categorías']);
        importData.categories = categoriesSheet.map((row: any) => ({
          id: row.ID,
          name: row.Nombre,
          color: row.Color,
          isSystem: row['Sistema'] === 'Sí'
        }));
      }

      // Enviar a Google Apps Script
      const response = await fetch(`${API_URL}?action=importAll`, {
        method: 'POST',
        body: JSON.stringify({ data: importData })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `${result.importedCount} items importados correctamente${
            result.errors && result.errors.length > 0 ? `. ${result.errors.length} errores encontrados.` : '.'
          }`
        });
        onImportSuccess?.();
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al importar datos' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error}` });
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar a Excel (Descargar)
          </Button>

          <Button
            onClick={handleExportToDrive}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Cloud className="w-4 h-4" />
            Exportar a Google Drive
          </Button>

          <label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              disabled={isLoading}
              className="hidden"
            />
            <Button
              disabled={isLoading}
              className="flex items-center gap-2"
              asChild
            >
              <span>
                <Upload className="w-4 h-4" />
                Importar desde Excel
              </span>
            </Button>
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Tienes 83 notas guardadas. Exporta a Excel o Google Drive para hacer backup.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
