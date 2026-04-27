// ============================================
// AGREGAR ESTAS FUNCIONES A TU GOOGLE APPS SCRIPT
// ============================================

/**
 * Exporta todas las notas a un archivo Excel en Google Drive
 * Uso en la app: ?action=exportNotesToDrive
 */
function exportNotesToDrive() {
  try {
    const notes = getNotes();
    const timestamp = new Date();
    const fileName = `Notas_Agenda_${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}-${String(timestamp.getMinutes()).padStart(2, '0')}.xlsx`;
    
    // Crear libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // Preparar datos de notas
    const notesData = notes.map(note => ({
      'ID': note.id,
      'Contenido': note.content,
      'Categoría': note.category,
      'Etiquetas': Array.isArray(note.tags) ? note.tags.join(', ') : note.tags,
      'Fecha Creación': note.createdAt,
      'Fecha Modificación': note.updatedAt
    }));
    
    // Crear hoja de Notas
    const notesSheet = XLSX.utils.json_to_sheet(notesData);
    XLSX.utils.book_append_sheet(workbook, notesSheet, 'Notas');
    
    // Agregar hoja de Recordatorios
    const reminders = getReminders();
    const remindersData = reminders.map(reminder => ({
      'ID': reminder.id,
      'Título': reminder.title,
      'Categoría': reminder.category,
      'Fecha': reminder.date,
      'Hora': reminder.time,
      'Completado': reminder.completed ? 'Sí' : 'No',
      'Fecha Creación': reminder.createdAt,
      'Fecha Modificación': reminder.updatedAt
    }));
    
    const remindersSheet = XLSX.utils.json_to_sheet(remindersData);
    XLSX.utils.book_append_sheet(workbook, remindersSheet, 'Recordatorios');
    
    // Agregar hoja de Categorías
    const categories = getCategories();
    const categoriesData = categories.map(category => ({
      'ID': category.id,
      'Nombre': category.name,
      'Color': category.color,
      'Es Sistema': category.isSystem ? 'Sí' : 'No'
    }));
    
    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categorías');
    
    // Convertir a bytes
    const excelBytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = Utilities.newBlob(excelBytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName);
    
    // Guardar en Google Drive
    const driveFolder = DriveApp.getRootFolder();
    const file = driveFolder.createFile(blob);
    
    // Registrar en historial
    addToHistory('export', 'drive', 'export_to_drive', 'archivo', null, fileName, `${notes.length} notas exportadas a Drive`);
    
    return {
      success: true,
      message: `${notes.length} notas exportadas correctamente a Google Drive`,
      fileName: fileName,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      notesCount: notes.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    Logger.log('Error exportando a Drive: ' + error.toString());
    return {
      error: 'Error al exportar a Drive: ' + error.toString()
    };
  }
}

/**
 * Función mejorada: Exporta a Drive y retorna la URL del archivo
 * Uso: ?action=exportNotesToDriveAdvanced
 */
function exportNotesToDriveAdvanced() {
  try {
    const notes = getNotes();
    const reminders = getReminders();
    const categories = getCategories();
    const timestamp = new Date();
    
    // Crear nombre del archivo con fecha
    const fileName = `Agenda_Vicedirección_${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
    
    // Verificar si la carpeta "Agenda Vicedirección" existe
    let targetFolder = null;
    const folders = DriveApp.getRootFolder().getFoldersByName('Agenda Vicedirección');
    
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      // Crear carpeta si no existe
      targetFolder = DriveApp.getRootFolder().createFolder('Agenda Vicedirección');
    }
    
    // Crear un Google Sheet en lugar de Excel (más compatible con Drive)
    const spreadsheet = SpreadsheetApp.create(fileName);
    const ss = spreadsheet;
    
    // Hoja 1: Notas
    const notesSheet = ss.getActiveSheet();
    notesSheet.setName('Notas');
    notesSheet.appendRow(['ID', 'Contenido', 'Categoría', 'Etiquetas', 'Fecha Creación', 'Fecha Modificación']);
    notesSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#2d5016').setFontColor('#ffffff');
    
    notes.forEach(note => {
      const tags = Array.isArray(note.tags) ? note.tags.join(', ') : note.tags;
      notesSheet.appendRow([note.id, note.content, note.category, tags, note.createdAt, note.updatedAt]);
    });
    
    // Hoja 2: Recordatorios
    const remindersSheet = ss.insertSheet('Recordatorios');
    remindersSheet.appendRow(['ID', 'Título', 'Categoría', 'Fecha', 'Hora', 'Completado', 'Fecha Creación', 'Fecha Modificación']);
    remindersSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#2d5016').setFontColor('#ffffff');
    
    reminders.forEach(reminder => {
      const completed = reminder.completed ? 'Sí' : 'No';
      remindersSheet.appendRow([reminder.id, reminder.title, reminder.category, reminder.date, reminder.time, completed, reminder.createdAt, reminder.updatedAt]);
    });
    
    // Hoja 3: Categorías
    const categoriesSheet = ss.insertSheet('Categorías');
    categoriesSheet.appendRow(['ID', 'Nombre', 'Color', 'Es Sistema']);
    categoriesSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#2d5016').setFontColor('#ffffff');
    
    categories.forEach(category => {
      const isSystem = category.isSystem ? 'Sí' : 'No';
      categoriesSheet.appendRow([category.id, category.name, category.color, isSystem]);
    });
    
    // Hoja 4: Resumen
    const summarySheet = ss.insertSheet('Resumen', 0);
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
    
    // Mover el archivo a la carpeta
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

/**
 * Retorna lista de archivos exportados en Drive
 */
function getExportedFiles() {
  try {
    const files = [];
    const folders = DriveApp.getRootFolder().getFoldersByName('Agenda Vicedirección');
    
    if (folders.hasNext()) {
      const folder = folders.next();
      const folderFiles = folder.getFiles();
      
      while (folderFiles.hasNext()) {
        const file = folderFiles.next();
        files.push({
          name: file.getName(),
          url: file.getUrl(),
          id: file.getId(),
          createdDate: file.getDateCreated().toISOString(),
          modifiedDate: file.getLastUpdated().toISOString()
        });
      }
    }
    
    return {
      success: true,
      files: files,
      totalFiles: files.length
    };
  } catch (error) {
    return {
      error: 'Error obteniendo archivos: ' + error.toString()
    };
  }
}

// ============================================
// AGREGAR ESTOS CASOS AL SWITCH DE handleRequest()
// ============================================

/*
  case 'exportNotesToDrive':
    result = exportNotesToDrive();
    break;
  
  case 'exportNotesToDriveAdvanced':
    result = exportNotesToDriveAdvanced();
    break;
  
  case 'getExportedFiles':
    result = getExportedFiles();
    break;
*/
