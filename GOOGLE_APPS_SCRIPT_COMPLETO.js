/**
 * ================================================================
 * GOOGLE APPS SCRIPT COMPLETO — AGENDA VICEDIRECCIÓN
 * ================================================================
 *
 * INSTRUCCIONES DE INSTALACIÓN:
 * ─────────────────────────────
 * 1. Abre https://script.google.com y crea un proyecto nuevo.
 * 2. Copia TODO este código en el editor (reemplaza el contenido existente).
 * 3. En la variable SPREADSHEET_ID (línea ~30) reemplaza el valor por el ID
 *    de tu Google Sheet. El ID está en la URL:
 *    https://docs.google.com/spreadsheets/d/  <<ESTE_ES_EL_ID>>  /edit
 * 4. Asegurate de que el Sheet tenga las siguientes hojas (exactamente):
 *       Categorías | Notas | Recordatorios | Historial
 *    Si no existen, ejecuta initializeSheets() desde el menú "Ejecutar".
 * 5. Deploy → "Nueva implementación" → Tipo: "Aplicación web"
 *       - Ejecutar como: "Yo mismo"
 *       - Quién puede acceder: "Cualquier persona"
 * 6. Copia la URL generada y pégala en tu proyecto Next.js como:
 *       NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=<URL>
 *
 * ACCIONES DISPONIBLES (GET):
 * ─────────────────────────────
 *   getCategories | addCategory | updateCategory | deleteCategory
 *   getNotes      | deleteNote  | deleteReminder | completeReminder
 *   getReminders  | getHistory  | deleteHistory  | clearHistory
 *   getStats      | exportAll   | initializeSheets
 *
 * ACCIONES DISPONIBLES (POST — body JSON):
 * ─────────────────────────────────────────
 *   addNote | updateNote | addReminder | updateReminder
 *   addCategory | updateCategory | importAll
 * ================================================================
 */

// ============================================================
// CONFIGURACIÓN PRINCIPAL
// ============================================================
const SPREADSHEET_ID = "TU_SPREADSHEET_ID_AQUI"; // <-- REEMPLAZA ESTO

const SHEET_NAMES = {
  CATEGORIES: "Categorías",
  NOTES:      "Notas",
  REMINDERS:  "Recordatorios",
  HISTORY:    "Historial"
};

// ============================================================
// INICIALIZACIÓN DE HOJAS
// ============================================================
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetNames = Object.values(SHEET_NAMES);
  for (const name of sheetNames) {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  }
  initializeCategoriesSheet(ss);
  initializeNotesSheet(ss);
  initializeRemindersSheet(ss);
  initializeHistorySheet(ss);
  return { success: true, message: "Hojas inicializadas correctamente" };
}

function initializeCategoriesSheet(ss) {
  ss = ss || SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.CATEGORIES);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Nombre", "Color", "Es Sistema", "ID Padre", "Fecha Creación", "Fecha Modificación"]);
    const now = new Date().toISOString();
    const defaultCategories = [
      { name: "1° Año",  color: "#22c55e" },
      { name: "2° Año",  color: "#3b82f6" },
      { name: "3° Año",  color: "#f59e0b" },
      { name: "4° Año",  color: "#ef4444" },
      { name: "5° Año",  color: "#8b5cf6" },
      { name: "6° Año",  color: "#06b6d4" },
      { name: "7° Año",  color: "#ec4899" },
      { name: "General", color: "#6b7280" }
    ];
    for (const cat of defaultCategories) {
      sheet.appendRow([Utilities.getUuid(), cat.name, cat.color, true, "", now, now]);
    }
  }
}

function initializeNotesSheet(ss) {
  ss = ss || SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.NOTES);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Contenido", "Categoría", "ID Categoría", "Etiquetas", "Etiqueta Principal", "URL Adjunto", "Fecha Creación", "Fecha Modificación"]);
  }
}

function initializeRemindersSheet(ss) {
  ss = ss || SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.REMINDERS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Título", "Categoría", "ID Categoría", "Fecha", "Hora", "Completado", "ID Evento Calendar", "Fecha Creación", "Fecha Modificación"]);
  }
}

function initializeHistorySheet(ss) {
  ss = ss || SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Timestamp", "Tipo", "ID Item", "Acción", "Campo Modificado", "Valor Anterior", "Valor Nuevo", "Detalles"]);
  }
}

// ============================================================
// UTILIDAD: LOG DE HISTORIAL
// ============================================================
function logHistory(type, itemId, action, fieldModified, oldValue, newValue, details) {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  sheet.appendRow([
    Utilities.getUuid(),
    new Date().toISOString(),
    type,
    itemId,
    action,
    fieldModified || "",
    oldValue  !== undefined ? JSON.stringify(oldValue)  : "",
    newValue  !== undefined ? JSON.stringify(newValue)  : "",
    details || ""
  ]);
}

// ============================================================
// CORS — helper para respuestas
// ============================================================
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// CATEGORÍAS
// ============================================================
function getCategories() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.CATEGORIES);
  const data  = sheet.getDataRange().getValues();
  const out   = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // skip empty rows
    // parentId: only set when the cell has a real non-empty value
    const rawParent = String(row[4] || "").trim();
    out.push({
      id:        String(row[0]),
      name:      String(row[1]),
      color:     String(row[2] || "#6b7280"),
      isSystem:  row[3] === true || row[3] === "TRUE",
      parentId:  rawParent.length > 0 ? rawParent : null,
      createdAt: row[5] || new Date().toISOString(),
      updatedAt: row[6] || new Date().toISOString()
    });
  }
  return out;
}

function addCategory(name, color, parentId) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.CATEGORIES);
  const id    = Utilities.getUuid();
  const now   = new Date().toISOString();
  sheet.appendRow([id, name, color || "#6b7280", false, parentId || "", now, now]);
  logHistory("category", id, "create", "Nombre", null, name, "Categoría creada: " + name);
  return { success: true, data: { category: { id, name, color, isSystem: false, parentId: parentId || null } } };
}

function updateCategory(id, name, color) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.CATEGORIES);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const oldName = data[i][1], oldColor = data[i][2];
      sheet.getRange(i + 1, 2).setValue(name);
      sheet.getRange(i + 1, 3).setValue(color);
      sheet.getRange(i + 1, 7).setValue(new Date().toISOString());
      logHistory("category", id, "update", "Nombre",  oldName,  name);
      logHistory("category", id, "update", "Color",   oldColor, color);
      return { success: true };
    }
  }
  return { success: false, error: "Categoría no encontrada" };
}

function deleteCategory(id) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.CATEGORIES);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const name = data[i][1];
      sheet.deleteRow(i + 1);
      logHistory("category", id, "delete", "Nombre", name, null, "Categoría eliminada: " + name);
      return { success: true };
    }
  }
  return { success: false, error: "Categoría no encontrada" };
}

// ============================================================
// NOTAS
// Columnas nuevas (9):  ID | Contenido | Categoría | ID Cat | Etiquetas | Etiqueta Principal | URL | Creación | Modificación
// Columnas viejas (8):  ID | Contenido | Categoría | ID Cat | Etiquetas | URL | Creación | Modificación
// getNotesColumns() detecta cuál formato tiene el sheet en base al header.
// ============================================================

function getNotesColumns(headerRow) {
  // headerRow is data[0] (the first row, 0-indexed array)
  // Returns an object with 0-based column indices for each field.
  var hasMainTag = false;
  for (var i = 0; i < headerRow.length; i++) {
    var h = String(headerRow[i] || "").toLowerCase();
    if (h.indexOf("principal") !== -1 || h.indexOf("maintag") !== -1) {
      hasMainTag = true;
      break;
    }
  }
  if (hasMainTag) {
    // New format: 9 columns
    return { id:0, content:1, category:2, categoryId:3, tags:4, mainTag:5, url:6, createdAt:7, updatedAt:8, total:9 };
  } else {
    // Old format: 8 columns — mainTag does not exist
    return { id:0, content:1, category:2, categoryId:3, tags:4, mainTag:-1, url:5, createdAt:6, updatedAt:7, total:8 };
  }
}

// Migrate old 8-column notes sheet to new 9-column format (inserts "Etiqueta Principal" column)
function migrateNotesSheet() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAMES.NOTES);
  var data  = sheet.getDataRange().getValues();
  if (data.length === 0) return { success: true, message: "Hoja vacía" };
  var cols = getNotesColumns(data[0]);
  if (cols.mainTag !== -1) return { success: true, message: "Ya está en formato nuevo" };
  // Insert new column at position 6 (after tags col 5, before url col 6)
  sheet.insertColumnAfter(5); // inserts after column E (index 4 = 5th col)
  sheet.getRange(1, 6).setValue("Etiqueta Principal");
  return { success: true, message: "Migración completada: columna 'Etiqueta Principal' agregada" };
}

function getNotes(category) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAMES.NOTES);
  var data  = sheet.getDataRange().getValues();
  var out   = [];
  if (data.length < 2) return out;
  
  var cols = getNotesColumns(data[0]);

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[cols.id]) continue; // skip empty rows
    if (category && String(row[cols.category]) !== String(category)) continue;

    // Parse tags — always return a clean array
    var tags = parseTags(row[cols.tags]);

    // mainTag — only if column exists and has value
    var mainTagVal = undefined;
    if (cols.mainTag >= 0) {
      var rawMain = String(row[cols.mainTag] || "").trim();
      if (rawMain.length > 0) mainTagVal = rawMain;
    }

    out.push({
      id:            String(row[cols.id]),
      content:       String(row[cols.content]),
      text:          String(row[cols.content]),
      category:      String(row[cols.category]),
      categoryName:  String(row[cols.category]),
      categoryId:    String(row[cols.categoryId]),
      tags:          tags,
      mainTag:       mainTagVal,
      attachmentUrl: cols.url >= 0 ? (String(row[cols.url] || "")) : "",
      createdAt:     row[cols.createdAt] || new Date().toISOString(),
      updatedAt:     row[cols.updatedAt] || new Date().toISOString()
    });
  }
  return out;
}

function addNote(content, category, categoryId, tags, mainTag) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAMES.NOTES);
  var id    = Utilities.getUuid();
  var now   = new Date().toISOString();
  var data  = sheet.getDataRange().getValues();
  var cols  = data.length > 0 ? getNotesColumns(data[0]) : { mainTag: 5, total: 9 };

  var cleanTags  = parseTags(tags);
  var tagsStr    = cleanTags.join(",");
  var mainTagStr = (mainTag && String(mainTag).trim().length > 0) ? String(mainTag).trim() : "";

  if (cols.mainTag >= 0) {
    // New 9-column format
    sheet.appendRow([id, content, category || "General", categoryId || "", tagsStr, mainTagStr, "", now, now]);
  } else {
    // Old 8-column format (no mainTag column yet — migrate first)
    sheet.appendRow([id, content, category || "General", categoryId || "", tagsStr, "", now, now]);
  }
  logHistory("note", id, "create", "Contenido", null, content, "Nota creada en: " + (category || "General"));
  return {
    success: true,
    data: { note: { id, content, text: content, category, categoryId, tags: cleanTags, mainTag: mainTagStr || undefined, createdAt: now, updatedAt: now } }
  };
}

function updateNote(id, content, category, categoryId, tags, mainTag) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAMES.NOTES);
  var data  = sheet.getDataRange().getValues();
  if (data.length === 0) return { success: false, error: "Hoja vacía" };
  var cols = getNotesColumns(data[0]);
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][cols.id]) === String(id)) {
      var old       = data[i][cols.content];
      var cleanTags = parseTags(tags);
      var tagsStr   = cleanTags.join(",");
      
      sheet.getRange(i + 1, cols.content  + 1).setValue(content);
      sheet.getRange(i + 1, cols.category + 1).setValue(category || data[i][cols.category]);
      sheet.getRange(i + 1, cols.tags     + 1).setValue(tagsStr);
      if (cols.mainTag >= 0) {
        var mainTagStr = (mainTag && String(mainTag).trim().length > 0) ? String(mainTag).trim() : "";
        sheet.getRange(i + 1, cols.mainTag + 1).setValue(mainTagStr);
      }
      sheet.getRange(i + 1, cols.updatedAt + 1).setValue(new Date().toISOString());
      logHistory("note", id, "update", "Contenido", old, content);
      return { success: true };
    }
  }
  return { success: false, error: "Nota no encontrada" };
}

function deleteNote(id) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.NOTES);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const content = data[i][1];
      sheet.deleteRow(i + 1);
      logHistory("note", id, "delete", "Contenido", content, null, "Nota eliminada");
      return { success: true };
    }
  }
  return { success: false, error: "Nota no encontrada" };
}

// ============================================================
// RECORDATORIOS
// ============================================================
function getReminders(category, status) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.REMINDERS);
  const data  = sheet.getDataRange().getValues();
  const out   = [];
  for (let i = 1; i < data.length; i++) {
    const row       = data[i];
    const completed = row[6] === true || row[6] === "TRUE";
    if (category && row[2] !== category) continue;
    if (status === "pending"   &&  completed) continue;
    if (status === "completed" && !completed) continue;
    out.push({
      id:              row[0],
      title:           row[1],
      text:            row[1],
      category:        row[2],
      categoryName:    row[2],
      categoryId:      row[3],
      date:            row[4],
      dueDate:         row[4],
      time:            row[5],
      dueTime:         row[5],
      completed:       completed,
      calendarEventId: row[7] || "",
      createdAt:       row[8],
      updatedAt:       row[9]
    });
  }
  return out;
}

function addReminder(title, category, categoryId, date, time) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.REMINDERS);
  const id    = Utilities.getUuid();
  const now   = new Date().toISOString();
  sheet.appendRow([id, title, category || "General", categoryId || "", date || "", time || "", false, "", now, now]);
  logHistory("reminder", id, "create", "Título", null, title, "Recordatorio: " + date);
  return {
    success: true,
    data: { reminder: { id, title, text: title, category, categoryId, date, dueDate: date, time, completed: false, createdAt: now } }
  };
}

function updateReminder(id, title, category, categoryId, date, time) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.REMINDERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const old = data[i][1];
      sheet.getRange(i + 1, 2).setValue(title);
      sheet.getRange(i + 1, 3).setValue(category || data[i][2]);
      sheet.getRange(i + 1, 4).setValue(categoryId || data[i][3]);
      sheet.getRange(i + 1, 5).setValue(date || data[i][4]);
      sheet.getRange(i + 1, 6).setValue(time || data[i][5]);
      sheet.getRange(i + 1, 10).setValue(new Date().toISOString());
      logHistory("reminder", id, "update", "Título", old, title);
      return { success: true };
    }
  }
  return { success: false, error: "Recordatorio no encontrado" };
}

function completeReminder(id) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.REMINDERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 7).setValue(true);
      sheet.getRange(i + 1, 10).setValue(new Date().toISOString());
      logHistory("reminder", id, "complete", "Estado", false, true, "Marcado completado");
      return { success: true };
    }
  }
  return { success: false, error: "Recordatorio no encontrado" };
}

function deleteReminder(id) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.REMINDERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const text = data[i][1];
      sheet.deleteRow(i + 1);
      logHistory("reminder", id, "delete", "Título", text, null, "Recordatorio eliminado");
      return { success: true };
    }
  }
  return { success: false, error: "Recordatorio no encontrado" };
}

// ============================================================
// HISTORIAL
// ============================================================
function getHistory(type, itemId, limit) {
  limit = limit || 100;
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  const data  = sheet.getDataRange().getValues();
  const out   = [];
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (type   && row[2] !== type)   continue;
    if (itemId && row[3] !== itemId) continue;
    out.push({
      id:            row[0],
      timestamp:     row[1],
      type:          row[2],
      itemId:        row[3],
      action:        row[4],
      fieldModified: row[5],
      oldValue:      row[6] ? tryParseJSON(row[6]) : null,
      newValue:      row[7] ? tryParseJSON(row[7]) : null,
      details:       row[8] || ""
    });
    if (out.length >= limit) break;
  }
  return out;
}

// Eliminar un registro de historial por su ID (columna 0 = ID)
function deleteHistory(historyId) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === historyId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: "Registro no encontrado" };
}

// Limpiar TODO el historial (mantiene el header)
function clearHistory() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.HISTORY);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  return { success: true, message: "Historial limpiado" };
}

function tryParseJSON(str) {
  try { return JSON.parse(str); } catch (_) { return str; }
}

// ============================================================
// ESTADÍSTICAS
// ============================================================
function getStats() {
  const categories = getCategories();
  const notes      = getNotes();
  const reminders  = getReminders();
  const now        = new Date();
  const today      = now.toISOString().split("T")[0];

  const notesByCategory     = {};
  const remindersByCategory = {};
  for (const n of notes) {
    notesByCategory[n.category] = (notesByCategory[n.category] || 0) + 1;
  }
  for (const r of reminders) {
    remindersByCategory[r.category] = (remindersByCategory[r.category] || 0) + 1;
  }
  const pendingReminders   = reminders.filter(function(r) { return !r.completed; }).length;
  const completedReminders = reminders.filter(function(r) { return r.completed;  }).length;
  const overdueReminders   = reminders.filter(function(r) {
    return !r.completed && r.date && r.date < today;
  }).length;
  const todayReminders     = reminders.filter(function(r) {
    return !r.completed && r.date && r.date.startsWith(today);
  }).length;

  return {
    success: true,
    data: {
      totalNotes: notes.length,
      totalReminders: reminders.length,
      pendingReminders,
      completedReminders,
      overdueReminders,
      todayReminders,
      totalCategories: categories.length,
      notesByCategory,
      remindersByCategory
    }
  };
}

// ============================================================
// IMPORTACIÓN / EXPORTACIÓN
// ============================================================
function exportAll() {
  return {
    success: true,
    data: {
      categories: getCategories(),
      notes:      getNotes(),
      reminders:  getReminders(),
      history:    getHistory(null, null, 2000),
      exportedAt: new Date().toISOString()
    }
  };
}

function importAll(importData) {
  var imported = 0;
  var errors   = [];

  // Categorías
  if (importData.categories && Array.isArray(importData.categories)) {
    var existingCats = getCategories().map(function(c) { return c.id; });
    for (var i = 0; i < importData.categories.length; i++) {
      var cat = importData.categories[i];
      if (existingCats.indexOf(cat.id) === -1) {
        try {
          addCategory(cat.name, cat.color, cat.parentId || "");
          imported++;
        } catch(e) { errors.push("Cat: " + e.message); }
      }
    }
  }

  // Notas
  if (importData.notes && Array.isArray(importData.notes)) {
    var existingNotes = getNotes().map(function(n) { return n.id; });
    for (var i = 0; i < importData.notes.length; i++) {
      var note = importData.notes[i];
      if (existingNotes.indexOf(note.id) === -1) {
        try {
          var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
          var sheet = ss.getSheetByName(SHEET_NAMES.NOTES);
          var text  = note.content || note.text || "";
          var cat   = note.category || note.categoryName || "General";
          var catId = note.categoryId || "";
          // Clean and filter tags: remove empty strings and trim whitespace
          var cleanTags = [];
          if (Array.isArray(note.tags)) {
            cleanTags = note.tags
              .map(function(t) { return String(t).trim(); })
              .filter(function(t) { return t.length > 0; });
          }
          var tags = cleanTags.join(",");
          var mainTagVal = (note.mainTag && String(note.mainTag).trim().length > 0) ? String(note.mainTag).trim() : "";
          sheet.appendRow([note.id, text, cat, catId, tags, mainTagVal, "", note.createdAt || new Date().toISOString(), note.updatedAt || new Date().toISOString()]);
          logHistory("note", note.id, "import", "Contenido", null, text);
          imported++;
        } catch(e) { errors.push("Nota: " + e.message); }
      }
    }
  }

  // Recordatorios
  if (importData.reminders && Array.isArray(importData.reminders)) {
    var existingRem = getReminders().map(function(r) { return r.id; });
    for (var i = 0; i < importData.reminders.length; i++) {
      var rem = importData.reminders[i];
      if (existingRem.indexOf(rem.id) === -1) {
        try {
          var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
          var sheet = ss.getSheetByName(SHEET_NAMES.REMINDERS);
          var title = rem.title || rem.text || "";
          var cat   = rem.category || rem.categoryName || "General";
          var catId = rem.categoryId || "";
          sheet.appendRow([rem.id, title, cat, catId, rem.date || rem.dueDate || "", rem.time || rem.dueTime || "", rem.completed || false, "", rem.createdAt || new Date().toISOString(), rem.updatedAt || new Date().toISOString()]);
          logHistory("reminder", rem.id, "import", "Título", null, title);
          imported++;
        } catch(e) { errors.push("Rem: " + e.message); }
      }
    }
  }

  return { success: true, importedCount: imported, errors: errors.length ? errors : undefined };
}

// ============================================================
// MANEJADOR GET (doGet)
// ============================================================
function doGet(e) {
  var action = e.parameter.action;
  try {
    switch (action) {

      // ── Categorías ──
      case "getCategories":
        return jsonResponse({ success: true, data: getCategories() });

      case "addCategory":
        return jsonResponse(addCategory(e.parameter.name, e.parameter.color, e.parameter.parentId));

      case "updateCategory":
        return jsonResponse(updateCategory(e.parameter.id, e.parameter.name, e.parameter.color));

      case "deleteCategory":
        return jsonResponse(deleteCategory(e.parameter.id));

      // ── Notas ──
      case "getNotes":
        return jsonResponse({ success: true, data: getNotes(e.parameter.category) });

      case "deleteNote":
        return jsonResponse(deleteNote(e.parameter.id));

      // ── Recordatorios ──
      case "getReminders":
        return jsonResponse({ success: true, data: getReminders(e.parameter.category, e.parameter.status) });

      case "completeReminder":
        return jsonResponse(completeReminder(e.parameter.id));

      case "deleteReminder":
        return jsonResponse(deleteReminder(e.parameter.id));

      // ── Historial ──
      case "getHistory":
        return jsonResponse({
          success: true,
          data: getHistory(e.parameter.type, e.parameter.itemId, parseInt(e.parameter.limit || "100"))
        });

      case "deleteHistory":
        return jsonResponse(deleteHistory(e.parameter.id));

      case "clearHistory":
        return jsonResponse(clearHistory());

      // ── Misceláneas ──
      case "getStats":
        return jsonResponse(getStats());

      case "exportAll":
        return jsonResponse(exportAll());

      case "initializeSheets":
        return jsonResponse(initializeSheets());

      case "migrateNotesSheet":
        return jsonResponse(migrateNotesSheet());

      default:
        return jsonResponse({ success: false, error: "Acción no reconocida: " + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
// MANEJADOR POST (doPost)
// ============================================================
function doPost(e) {
  var action = e.parameter.action;
  var body   = {};

  try {
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonResponse({ success: false, error: "JSON inválido en el cuerpo de la solicitud" });
  }

  try {
    switch (action) {

      // ── Notas ──
      case "addNote":
        // Aceptar tanto { content, category, tags, mainTag } como { text, categoryName, tags }
        return jsonResponse(addNote(
          body.content || body.text || "",
          body.category || body.categoryName || "General",
          body.categoryId || "",
          body.tags || [],
          body.mainTag || ""
        ));

      case "updateNote":
        return jsonResponse(updateNote(
          body.id,
          body.content || body.text || "",
          body.category || body.categoryName || "General",
          body.categoryId || "",
          body.tags || [],
          body.mainTag || ""
        ));

      // ── Recordatorios ──
      case "addReminder":
        // Aceptar { title, category, date, time } o { text, categoryName, dueDate, dueTime }
        return jsonResponse(addReminder(
          body.title || body.text || "",
          body.category || body.categoryName || "General",
          body.categoryId || "",
          body.date || body.dueDate || "",
          body.time || body.dueTime || ""
        ));

      case "updateReminder":
        return jsonResponse(updateReminder(
          body.id,
          body.title || body.text || "",
          body.category || body.categoryName || "General",
          body.categoryId || "",
          body.date || body.dueDate || "",
          body.time || body.dueTime || ""
        ));

      // ── Categorías ──
      case "addCategory":
        return jsonResponse(addCategory(body.name, body.color, body.parentId || ""));

      case "updateCategory":
        return jsonResponse(updateCategory(body.id, body.name, body.color));

      // ── Importación masiva ──
      case "importAll":
        return jsonResponse(importAll(body.data || body));

      // ── Historial ──
      case "deleteHistory":
        return jsonResponse(deleteHistory(body.id));

      case "clearHistory":
        return jsonResponse(clearHistory());

      default:
        // Intentar como GET fallback
        return doGet(e);
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}
