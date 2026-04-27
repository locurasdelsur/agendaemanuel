// ============================================
// AGENDA VICEDIRECCIÓN - E.E.S.T. Nº6
// API Google Apps Script con Google Calendar
// VERSIÓN 2.0 - CON HISTORIAL DE CAMBIOS
// ============================================

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Nombres de las hojas
const SHEETS = {
  NOTES: 'Notas',
  REMINDERS: 'Recordatorios',
  CATEGORIES: 'Categorías',
  CONFIG: 'Configuración',
  HISTORY: 'Historial' // NUEVA: Hoja de historial
};

// ID del calendario (por defecto usa el calendario principal)
const CALENDAR_ID = 'primary';

// ============================================
// INICIALIZACIÓN
// ============================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter;
  const action = params.action;
  
  let result;
  
  try {
    switch (action) {
      // Notas
      case 'getNotes':
        result = getNotes(params.category);
        break;
      case 'addNote':
        result = addNote(JSON.parse(e.postData.contents));
        break;
      case 'updateNote':
        result = updateNote(JSON.parse(e.postData.contents));
        break;
      case 'deleteNote':
        result = deleteNote(params.id);
        break;
      
      // Recordatorios
      case 'getReminders':
        result = getReminders(params.category, params.status);
        break;
      case 'addReminder':
        result = addReminder(JSON.parse(e.postData.contents));
        break;
      case 'updateReminder':
        result = updateReminder(JSON.parse(e.postData.contents));
        break;
      case 'deleteReminder':
        result = deleteReminder(params.id);
        break;
      case 'completeReminder':
        result = completeReminder(params.id);
        break;
      
      // Categorías
      case 'getCategories':
        result = getCategories();
        break;
      case 'addCategory':
        result = addCategory(JSON.parse(e.postData.contents));
        break;
      case 'updateCategory':
        result = updateCategory(JSON.parse(e.postData.contents));
        break;
      case 'deleteCategory':
        result = deleteCategory(params.id);
        break;
      
      // Historial
      case 'getHistory':
        result = getHistory(params.type, params.itemId, params.limit);
        break;
      
      // Exportar/Importar
      case 'exportAll':
        result = exportAllData();
        break;
      case 'importAll':
        result = importAllData(JSON.parse(e.postData.contents));
        break;
      
      // Estadísticas
      case 'getStats':
        result = getStats();
        break;
      
      // Inicializar
      case 'init':
        result = initializeSheets();
        break;
      
      default:
        result = { error: 'Acción no reconocida: ' + action };
    }
  } catch (error) {
    result = { error: error.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// INICIALIZAR HOJAS
// ============================================

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Crear hoja de Notas
  let notesSheet = ss.getSheetByName(SHEETS.NOTES);
  if (!notesSheet) {
    notesSheet = ss.insertSheet(SHEETS.NOTES);
    notesSheet.getRange(1, 1, 1, 6).setValues([
      ['ID', 'Contenido', 'Categoría', 'Etiquetas', 'Fecha Creación', 'Fecha Modificación']
    ]);
    notesSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#2d5016');
    notesSheet.getRange(1, 1, 1, 6).setFontColor('#ffffff');
  }
  
  // Crear hoja de Recordatorios
  let remindersSheet = ss.getSheetByName(SHEETS.REMINDERS);
  if (!remindersSheet) {
    remindersSheet = ss.insertSheet(SHEETS.REMINDERS);
    remindersSheet.getRange(1, 1, 1, 9).setValues([
      ['ID', 'Título', 'Categoría', 'Fecha', 'Hora', 'Completado', 'Fecha Creación', 'Fecha Modificación', 'Calendar Event ID']
    ]);
    remindersSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#2d5016');
    remindersSheet.getRange(1, 1, 1, 9).setFontColor('#ffffff');
  }
  
  // Crear hoja de Categorías
  let categoriesSheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!categoriesSheet) {
    categoriesSheet = ss.insertSheet(SHEETS.CATEGORIES);
    categoriesSheet.getRange(1, 1, 1, 4).setValues([
      ['ID', 'Nombre', 'Color', 'Es Sistema']
    ]);
    categoriesSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#2d5016');
    categoriesSheet.getRange(1, 1, 1, 4).setFontColor('#ffffff');
    
    // Agregar categorías por defecto
    const defaultCategories = [
      [generateId(), '1° Año', '#22c55e', true],
      [generateId(), '2° Año', '#3b82f6', true],
      [generateId(), '3° Año', '#f59e0b', true],
      [generateId(), '4° Año', '#ef4444', true],
      [generateId(), '5° Año', '#8b5cf6', true],
      [generateId(), '6° Año', '#06b6d4', true],
      [generateId(), '7° Año', '#ec4899', true],
      [generateId(), 'General', '#6b7280', true]
    ];
    categoriesSheet.getRange(2, 1, defaultCategories.length, 4).setValues(defaultCategories);
  }
  
  // NUEVA: Crear hoja de Historial
  let historySheet = ss.getSheetByName(SHEETS.HISTORY);
  if (!historySheet) {
    historySheet = ss.insertSheet(SHEETS.HISTORY);
    historySheet.getRange(1, 1, 1, 8).setValues([
      ['Timestamp', 'Tipo', 'ID del Item', 'Acción', 'Campo Modificado', 'Valor Anterior', 'Valor Nuevo', 'Detalles']
    ]);
    historySheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#1f2937');
    historySheet.getRange(1, 1, 1, 8).setFontColor('#ffffff');
  }
  
  // Eliminar la hoja por defecto si existe
  const defaultSheet = ss.getSheetByName('Hoja 1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
  
  return { success: true, message: 'Hojas inicializadas correctamente' };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function generateId() {
  return Utilities.getUuid();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return i + 1;
    }
  }
  return -1;
}

// ============================================
// HISTORIAL - NUEVA FUNCIONALIDAD
// ============================================

function addToHistory(type, itemId, action, fieldModified, oldValue, newValue, details = '') {
  try {
    const sheet = getSheet(SHEETS.HISTORY);
    if (!sheet) return false;
    
    const timestamp = getCurrentTimestamp();
    
    sheet.appendRow([
      timestamp,
      type, // 'note', 'reminder', 'category'
      itemId,
      action, // 'create', 'update', 'delete', 'complete'
      fieldModified,
      oldValue ? JSON.stringify(oldValue) : '',
      newValue ? JSON.stringify(newValue) : '',
      details
    ]);
    
    return true;
  } catch (error) {
    Logger.log('Error agregando al historial: ' + error.toString());
    return false;
  }
}

function getHistory(type, itemId, limit) {
  const sheet = getSheet(SHEETS.HISTORY);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const history = [];
  
  for (let i = 1; i < data.length; i++) {
    const record = {
      timestamp: data[i][0],
      type: data[i][1],
      itemId: data[i][2],
      action: data[i][3],
      fieldModified: data[i][4],
      oldValue: data[i][5] ? JSON.parse(data[i][5]) : null,
      newValue: data[i][6] ? JSON.parse(data[i][6]) : null,
      details: data[i][7]
    };
    
    let include = true;
    
    if (type && record.type !== type) include = false;
    if (itemId && record.itemId !== itemId) include = false;
    
    if (include) {
      history.push(record);
    }
  }
  
  // Ordenar por timestamp descendente (más recientes primero)
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Aplicar límite si se especifica
  if (limit) {
    return history.slice(0, parseInt(limit));
  }
  
  return history;
}

// ============================================
// INTEGRACIÓN CON GOOGLE CALENDAR
// ============================================

function createCalendarEvent(reminder) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      Logger.log('Calendario no encontrado');
      return null;
    }
    
    const [year, month, day] = reminder.date.split('-').map(Number);
    let startTime, endTime;
    
    if (reminder.time) {
      const [hours, minutes] = reminder.time.split(':').map(Number);
      startTime = new Date(year, month - 1, day, hours, minutes);
      endTime = new Date(year, month - 1, day, hours + 1, minutes);
    } else {
      startTime = new Date(year, month - 1, day);
      endTime = new Date(year, month - 1, day);
    }
    
    const categories = getCategories();
    const category = categories.find(c => c.id === reminder.categoryId || c.name === reminder.category);
    const categoryName = category ? category.name : 'General';
    
    let event;
    if (reminder.time) {
      event = calendar.createEvent(
        `[${categoryName}] ${reminder.title}`,
        startTime,
        endTime,
        {
          description: `Recordatorio de Agenda Vicedirección\nCategoría: ${categoryName}`,
          location: 'E.E.S.T. Nº6 - Banfield'
        }
      );
    } else {
      event = calendar.createAllDayEvent(
        `[${categoryName}] ${reminder.title}`,
        startTime,
        {
          description: `Recordatorio de Agenda Vicedirección\nCategoría: ${categoryName}`,
          location: 'E.E.S.T. Nº6 - Banfield'
        }
      );
    }
    
    event.addPopupReminder(30);
    event.addEmailReminder(60);
    
    return event.getId();
  } catch (error) {
    Logger.log('Error creando evento: ' + error.toString());
    return null;
  }
}

function deleteCalendarEvent(eventId) {
  try {
    if (!eventId) return false;
    
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) return false;
    
    const event = calendar.getEventById(eventId);
    if (event) {
      event.deleteEvent();
      return true;
    }
    return false;
  } catch (error) {
    Logger.log('Error eliminando evento: ' + error.toString());
    return false;
  }
}

function updateCalendarEvent(eventId, reminder) {
  try {
    if (!eventId) {
      return createCalendarEvent(reminder);
    }
    
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) return null;
    
    const event = calendar.getEventById(eventId);
    if (!event) {
      return createCalendarEvent(reminder);
    }
    
    const categories = getCategories();
    const category = categories.find(c => c.id === reminder.categoryId || c.name === reminder.category);
    const categoryName = category ? category.name : 'General';
    
    event.setTitle(`[${categoryName}] ${reminder.title}`);
    
    const [year, month, day] = reminder.date.split('-').map(Number);
    
    if (reminder.time) {
      const [hours, minutes] = reminder.time.split(':').map(Number);
      const startTime = new Date(year, month - 1, day, hours, minutes);
      const endTime = new Date(year, month - 1, day, hours + 1, minutes);
      event.setTime(startTime, endTime);
    } else {
      const startTime = new Date(year, month - 1, day);
      event.setAllDayDate(startTime);
    }
    
    return eventId;
  } catch (error) {
    Logger.log('Error actualizando evento: ' + error.toString());
    return null;
  }
}

// ============================================
// NOTAS
// ============================================

function getNotes(category) {
  const sheet = getSheet(SHEETS.NOTES);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const notes = [];
  
  for (let i = 1; i < data.length; i++) {
    const note = {
      id: data[i][0],
      content: data[i][1],
      category: data[i][2],
      tags: data[i][3] ? data[i][3].split(',').map(t => t.trim()) : [],
      createdAt: data[i][4],
      updatedAt: data[i][5]
    };
    
    if (!category || note.category === category) {
      notes.push(note);
    }
  }
  
  return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function addNote(noteData) {
  const sheet = getSheet(SHEETS.NOTES);
  if (!sheet) return { error: 'Hoja de notas no encontrada' };
  
  const id = generateId();
  const timestamp = getCurrentTimestamp();
  const tags = Array.isArray(noteData.tags) ? noteData.tags.join(', ') : '';
  
  sheet.appendRow([
    id,
    noteData.content,
    noteData.category || 'General',
    tags,
    timestamp,
    timestamp
  ]);
  
  // Registrar en historial
  addToHistory('note', id, 'create', 'contenido', null, noteData.content, 'Nueva nota creada');
  
  return {
    success: true,
    note: {
      id,
      content: noteData.content,
      category: noteData.category || 'General',
      tags: noteData.tags || [],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };
}

function updateNote(noteData) {
  const sheet = getSheet(SHEETS.NOTES);
  if (!sheet) return { error: 'Hoja de notas no encontrada' };
  
  const row = findRowById(sheet, noteData.id);
  if (row === -1) return { error: 'Nota no encontrada' };
  
  const timestamp = getCurrentTimestamp();
  const tags = Array.isArray(noteData.tags) ? noteData.tags.join(', ') : '';
  
  // Obtener valores anteriores para el historial
  const oldContent = sheet.getRange(row, 2).getValue();
  const oldCategory = sheet.getRange(row, 3).getValue();
  const oldTags = sheet.getRange(row, 4).getValue();
  
  sheet.getRange(row, 2).setValue(noteData.content);
  sheet.getRange(row, 3).setValue(noteData.category);
  sheet.getRange(row, 4).setValue(tags);
  sheet.getRange(row, 6).setValue(timestamp);
  
  // Registrar cambios en historial
  if (oldContent !== noteData.content) {
    addToHistory('note', noteData.id, 'update', 'contenido', oldContent, noteData.content);
  }
  if (oldCategory !== noteData.category) {
    addToHistory('note', noteData.id, 'update', 'categoría', oldCategory, noteData.category);
  }
  if (oldTags !== tags) {
    addToHistory('note', noteData.id, 'update', 'etiquetas', oldTags, tags);
  }
  
  return { success: true, updatedAt: timestamp };
}

function deleteNote(id) {
  const sheet = getSheet(SHEETS.NOTES);
  if (!sheet) return { error: 'Hoja de notas no encontrada' };
  
  const row = findRowById(sheet, id);
  if (row === -1) return { error: 'Nota no encontrada' };
  
  // Obtener datos antes de eliminar
  const deletedContent = sheet.getRange(row, 2).getValue();
  
  sheet.deleteRow(row);
  
  // Registrar en historial
  addToHistory('note', id, 'delete', 'nota completa', deletedContent, null, 'Nota eliminada');
  
  return { success: true };
}

// ============================================
// RECORDATORIOS (CON GOOGLE CALENDAR)
// ============================================

function getReminders(category, status) {
  const sheet = getSheet(SHEETS.REMINDERS);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const reminders = [];
  
  for (let i = 1; i < data.length; i++) {
    const reminder = {
      id: data[i][0],
      title: data[i][1],
      category: data[i][2],
      date: data[i][3],
      time: data[i][4],
      completed: data[i][5] === true || data[i][5] === 'TRUE',
      createdAt: data[i][6],
      updatedAt: data[i][7],
      calendarEventId: data[i][8] || null
    };
    
    let include = true;
    
    if (category && reminder.category !== category) {
      include = false;
    }
    
    if (status === 'pending' && reminder.completed) {
      include = false;
    } else if (status === 'completed' && !reminder.completed) {
      include = false;
    }
    
    if (include) {
      reminders.push(reminder);
    }
  }
  
  return reminders.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function addReminder(reminderData) {
  const sheet = getSheet(SHEETS.REMINDERS);
  if (!sheet) return { error: 'Hoja de recordatorios no encontrada' };
  
  const id = generateId();
  const timestamp = getCurrentTimestamp();
  
  const calendarEventId = createCalendarEvent({
    title: reminderData.title,
    category: reminderData.category || 'General',
    date: reminderData.date,
    time: reminderData.time || ''
  });
  
  sheet.appendRow([
    id,
    reminderData.title,
    reminderData.category || 'General',
    reminderData.date,
    reminderData.time || '',
    false,
    timestamp,
    timestamp,
    calendarEventId || ''
  ]);
  
  // Registrar en historial
  addToHistory('reminder', id, 'create', 'título', null, reminderData.title, 'Nuevo recordatorio creado');
  
  return {
    success: true,
    reminder: {
      id,
      title: reminderData.title,
      category: reminderData.category || 'General',
      date: reminderData.date,
      time: reminderData.time || '',
      completed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      calendarEventId: calendarEventId || null
    }
  };
}

function updateReminder(reminderData) {
  const sheet = getSheet(SHEETS.REMINDERS);
  if (!sheet) return { error: 'Hoja de recordatorios no encontrada' };
  
  const row = findRowById(sheet, reminderData.id);
  if (row === -1) return { error: 'Recordatorio no encontrado' };
  
  const timestamp = getCurrentTimestamp();
  
  // Obtener valores anteriores
  const oldTitle = sheet.getRange(row, 2).getValue();
  const oldCategory = sheet.getRange(row, 3).getValue();
  const oldDate = sheet.getRange(row, 4).getValue();
  const oldTime = sheet.getRange(row, 5).getValue();
  
  const existingEventId = sheet.getRange(row, 9).getValue();
  
  const calendarEventId = updateCalendarEvent(existingEventId, {
    title: reminderData.title,
    category: reminderData.category,
    date: reminderData.date,
    time: reminderData.time || ''
  });
  
  sheet.getRange(row, 2).setValue(reminderData.title);
  sheet.getRange(row, 3).setValue(reminderData.category);
  sheet.getRange(row, 4).setValue(reminderData.date);
  sheet.getRange(row, 5).setValue(reminderData.time || '');
  sheet.getRange(row, 8).setValue(timestamp);
  if (calendarEventId) {
    sheet.getRange(row, 9).setValue(calendarEventId);
  }
  
  // Registrar cambios en historial
  if (oldTitle !== reminderData.title) {
    addToHistory('reminder', reminderData.id, 'update', 'título', oldTitle, reminderData.title);
  }
  if (oldCategory !== reminderData.category) {
    addToHistory('reminder', reminderData.id, 'update', 'categoría', oldCategory, reminderData.category);
  }
  if (oldDate !== reminderData.date) {
    addToHistory('reminder', reminderData.id, 'update', 'fecha', oldDate, reminderData.date);
  }
  if (oldTime !== reminderData.time) {
    addToHistory('reminder', reminderData.id, 'update', 'hora', oldTime, reminderData.time || '');
  }
  
  return { success: true, updatedAt: timestamp };
}

function deleteReminder(id) {
  const sheet = getSheet(SHEETS.REMINDERS);
  if (!sheet) return { error: 'Hoja de recordatorios no encontrada' };
  
  const row = findRowById(sheet, id);
  if (row === -1) return { error: 'Recordatorio no encontrado' };
  
  // Obtener datos antes de eliminar
  const deletedTitle = sheet.getRange(row, 2).getValue();
  const calendarEventId = sheet.getRange(row, 9).getValue();
  if (calendarEventId) {
    deleteCalendarEvent(calendarEventId);
  }
  
  sheet.deleteRow(row);
  
  // Registrar en historial
  addToHistory('reminder', id, 'delete', 'recordatorio completo', deletedTitle, null, 'Recordatorio eliminado');
  
  return { success: true };
}

function completeReminder(id) {
  const sheet = getSheet(SHEETS.REMINDERS);
  if (!sheet) return { error: 'Hoja de recordatorios no encontrada' };
  
  const row = findRowById(sheet, id);
  if (row === -1) return { error: 'Recordatorio no encontrado' };
  
  const currentValue = sheet.getRange(row, 6).getValue();
  const newValue = !(currentValue === true || currentValue === 'TRUE');
  const timestamp = getCurrentTimestamp();
  
  sheet.getRange(row, 6).setValue(newValue);
  sheet.getRange(row, 8).setValue(timestamp);
  
  const calendarEventId = sheet.getRange(row, 9).getValue();
  if (newValue && calendarEventId) {
    deleteCalendarEvent(calendarEventId);
    sheet.getRange(row, 9).setValue('');
  } else if (!newValue) {
    const title = sheet.getRange(row, 2).getValue();
    const category = sheet.getRange(row, 3).getValue();
    const date = sheet.getRange(row, 4).getValue();
    const time = sheet.getRange(row, 5).getValue();
    
    const newEventId = createCalendarEvent({ title, category, date, time });
    if (newEventId) {
      sheet.getRange(row, 9).setValue(newEventId);
    }
  }
  
  // Registrar en historial
  addToHistory('reminder', id, newValue ? 'complete' : 'reopen', 'estado', !newValue, newValue, newValue ? 'Recordatorio completado' : 'Recordatorio reabierto');
  
  return { success: true, completed: newValue, updatedAt: timestamp };
}

// ============================================
// CATEGORÍAS
// ============================================

function getCategories() {
  const sheet = getSheet(SHEETS.CATEGORIES);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const categories = [];
  
  for (let i = 1; i < data.length; i++) {
    categories.push({
      id: data[i][0],
      name: data[i][1],
      color: data[i][2],
      isSystem: data[i][3] === true || data[i][3] === 'TRUE'
    });
  }
  
  return categories;
}

function addCategory(categoryData) {
  const sheet = getSheet(SHEETS.CATEGORIES);
  if (!sheet) return { error: 'Hoja de categorías no encontrada' };
  
  const id = generateId();
  
  sheet.appendRow([
    id,
    categoryData.name,
    categoryData.color || '#6b7280',
    false
  ]);
  
  // Registrar en historial
  addToHistory('category', id, 'create', 'nombre', null, categoryData.name, 'Nueva categoría creada');
  
  return {
    success: true,
    category: {
      id,
      name: categoryData.name,
      color: categoryData.color || '#6b7280',
      isSystem: false
    }
  };
}

function updateCategory(categoryData) {
  const sheet = getSheet(SHEETS.CATEGORIES);
  if (!sheet) return { error: 'Hoja de categorías no encontrada' };
  
  const row = findRowById(sheet, categoryData.id);
  if (row === -1) return { error: 'Categoría no encontrada' };
  
  // Obtener valores anteriores
  const oldName = sheet.getRange(row, 2).getValue();
  const oldColor = sheet.getRange(row, 3).getValue();
  
  sheet.getRange(row, 2).setValue(categoryData.name);
  sheet.getRange(row, 3).setValue(categoryData.color);
  
  // Registrar cambios en historial
  if (oldName !== categoryData.name) {
    addToHistory('category', categoryData.id, 'update', 'nombre', oldName, categoryData.name);
  }
  if (oldColor !== categoryData.color) {
    addToHistory('category', categoryData.id, 'update', 'color', oldColor, categoryData.color);
  }
  
  return { success: true };
}

function deleteCategory(id) {
  const sheet = getSheet(SHEETS.CATEGORIES);
  if (!sheet) return { error: 'Hoja de categorías no encontrada' };
  
  const row = findRowById(sheet, id);
  if (row === -1) return { error: 'Categoría no encontrada' };
  
  const isSystem = sheet.getRange(row, 4).getValue();
  if (isSystem === true || isSystem === 'TRUE') {
    return { error: 'No se pueden eliminar categorías del sistema' };
  }
  
  // Obtener datos antes de eliminar
  const deletedName = sheet.getRange(row, 2).getValue();
  
  sheet.deleteRow(row);
  
  // Registrar en historial
  addToHistory('category', id, 'delete', 'categoría completa', deletedName, null, 'Categoría eliminada');
  
  return { success: true };
}

// ============================================
// EXPORTAR / IMPORTAR
// ============================================

function exportAllData() {
  return {
    notes: getNotes(),
    reminders: getReminders(),
    categories: getCategories(),
    history: getHistory(),
    exportedAt: getCurrentTimestamp()
  };
}

function importAllData(data) {
  if (data.categories && Array.isArray(data.categories)) {
    const sheet = getSheet(SHEETS.CATEGORIES);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    data.categories.forEach(cat => {
      sheet.appendRow([cat.id, cat.name, cat.color, cat.isSystem || false]);
    });
  }
  
  if (data.notes && Array.isArray(data.notes)) {
    const sheet = getSheet(SHEETS.NOTES);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    data.notes.forEach(note => {
      const tags = Array.isArray(note.tags) ? note.tags.join(', ') : '';
      sheet.appendRow([
        note.id,
        note.content,
        note.category,
        tags,
        note.createdAt,
        note.updatedAt
      ]);
    });
  }
  
  if (data.reminders && Array.isArray(data.reminders)) {
    const sheet = getSheet(SHEETS.REMINDERS);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    data.reminders.forEach(rem => {
      sheet.appendRow([
        rem.id,
        rem.title,
        rem.category,
        rem.date,
        rem.time || '',
        rem.completed || false,
        rem.createdAt,
        rem.updatedAt,
        rem.calendarEventId || ''
      ]);
    });
  }
  
  return { success: true, message: 'Datos importados correctamente' };
}

// ============================================
// ESTADÍSTICAS
// ============================================

function getStats() {
  const notes = getNotes();
  const reminders = getReminders();
  const categories = getCategories();
  
  const remindersCompleted = reminders.filter(r => r.completed).length;
  const remindersPending = reminders.filter(r => !r.completed).length;
  
  return {
    totalNotes: notes.length,
    totalReminders: reminders.length,
    remindersCompleted: remindersCompleted,
    remindersPending: remindersPending,
    totalCategories: categories.length,
    completionRate: reminders.length > 0 ? ((remindersCompleted / reminders.length) * 100).toFixed(2) + '%' : '0%'
  };
}
