/**
 * Seeds historical agenda data into the app's localStorage format.
 * Run in the browser console: paste the output object into localStorage["agenda-vice-data"]
 * OR use the /api/seed endpoint created alongside this script.
 *
 * This script outputs a JSON file you can import via the app.
 */

import { writeFileSync } from "fs"

// ─── Helpers ────────────────────────────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function toISO(dateStr) {
  if (!dateStr) return new Date().toISOString()
  // Handle typo like "2925-07-19"
  const fixed = dateStr.replace(/^2925/, "2025")
  const d = new Date(fixed)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

// ─── Categories (match GAS exactly) ─────────────────────────────────────────
const CATEGORIES = [
  { id: "2c402b5b-aa86-4211-9e78-51366fc2becb", name: "1° Año",   color: "#22c55e" },
  { id: "4cf29c21-d685-4a86-a3aa-ac4565bf5c94", name: "2° Año",   color: "#3b82f6" },
  { id: "259df273-625c-417b-a25d-3f0900c469b6", name: "3° Año",   color: "#f59e0b" },
  { id: "6ca42b26-f2e2-466c-a569-7516f0efef54", name: "4° Año",   color: "#ef4444" },
  { id: "f2509f48-e475-4f42-96a3-ca82799d2a91", name: "5° Año",   color: "#8b5cf6" },
  { id: "7a9575a9-58c6-4cbb-becb-ba7f68bf4fc9", name: "6° Año",   color: "#06b6d4" },
  { id: "a3637348-695b-4420-9f69-a114757e681f", name: "7° Año",   color: "#ec4899" },
  { id: "d350a555-0193-4fe5-bfaf-4e3c7d6264c1", name: "General", color: "#6b7280" },
]

function resolveCategoryId(name) {
  if (!name) return "d350a555-0193-4fe5-bfaf-4e3c7d6264c1" // General
  const lower = name.toLowerCase().trim()
  const found = CATEGORIES.find((c) => c.name.toLowerCase().trim() === lower)
  if (found) return found.id
  // Partial: "Alumnos" → General, "Otros" → General
  return "d350a555-0193-4fe5-bfaf-4e3c7d6264c1"
}

// ─── Section 1: Tabla del mensaje (observaciones escolares) ─────────────────
const tableRows = [
  { name: "Rios Fiorella",                  course: "4° 1",  createdAt: "2025-09-17T19:41:19.973Z", observations: "Observar como se desempeña" },
  { name: "Morrone Benjamín",               course: "2° 1",  createdAt: "2025-09-17T19:41:58.945Z", observations: "Observar su salud (ojos)" },
  { name: "Díaz Bautista",                  course: "5° 2",  createdAt: "2025-09-17T19:45:37.282Z", observations: "No esta yendo a recursar" },
  { name: "Molinelli Angel",                course: "5° 2",  createdAt: "2025-09-17T19:46:21.121Z", observations: "No esta yendo a recursar" },
  { name: "Liz Rios Pereyra",               course: "1° 5",  createdAt: "2025-09-17T19:47:57.095Z", observations: "Tiene inconvenientes con la profe de Naturales y Lenguajes tecnológicos. Se reunió gabinete con la madre." },
  { name: "CENTURION GUILLERMO ALEJANDRO",  course: "2° 4",  createdAt: "2025-09-26T13:21:01.687Z", observations: "Se envió nota a los docentes para que realicen dispositivo virtual que facilite la cursada, ya que el alumno no puede bajar escaleras y en la casa tiene escaleras." },
  { name: "MANUEL POLINA VERNARELLI",       course: "2° 5",  createdAt: "2025-09-26T13:23:58.553Z", observations: "Se envió nota a los docentes sobre dispositivo virtual en virtud de la patología del alumno." },
]

const tableNotes = tableRows.map((r) => {
  const now = r.createdAt
  return {
    id: genId(),
    text: `[${r.name} - ${r.course}]\n${r.observations}`,
    categoryId: "d350a555-0193-4fe5-bfaf-4e3c7d6264c1", // General
    tags: [r.course.trim()],
    createdAt: now,
    updatedAt: now,
  }
})

// ─── Section 2: TSV attachment data ─────────────────────────────────────────
const tsvRows = [
  { date: "2025-08-21", title: "Potel Joaquín",                               category: "Alumnos", notes: "Se llamó a la madre de Joaquín Potel de 2° 1° para hablar sobre el desempeño del alumno, sumado a la nota dejada por la profe de artística que indicaba que el alumno vendía cosas de un videojuego a compañeros. La madre dijo saber y que estaba trabajando con el padre y el psicólogo del alumno. Además, se habló de las malas calificaciones del alumno." },
  { date: "2025-08-21", title: "Naveira Anaquin Andres",                       category: "Alumnos", notes: "Llame y hable con la madre de Andres Naveiras de 4° 2°, por las faltas y porque no firman la libreta. La madre afirma que discutió con el alumno porque está fumando y ya no sabe qué hacer para que haga caso." },
  { date: "2025-08-28", title: "Charla con Elisabet y EOE",                    category: "Otros",   notes: "Figueroa Ignacio 4° 2. Las Hermanas Gomez 3° 4 Matemática preparar. Brito 5° 1 Compañeros le hacen Bullyng. Garcete 6° 1 Engaño la novia seguir. Muñoz Máxima 1° 5 Estuvo bien en las charlas y está trabajando con el Psicólogo." },
  { date: "2024-05-08", title: "Engelbrecht Benjamin",                         category: "Alumnos", notes: "Me comuniqué por llamada telefónica el 8/5/25, la madre se comprometió a venir a la escuela." },
  { date: "2025-05-23", title: "Ojeda Nicolás 22 Inasistencias",               category: "Alumnos", notes: "Me comuniqué con la madre por llamada telefónica, la madre se compromete a venir a la escuela." },
  { date: "2025-05-23", title: "Castro Víctor 6° 1 15 inasistencia",           category: "Alumnos", notes: "Me comuniqué con la madre el día 23/25 por llamada telefónica, la madre se compromete a venir a la escuela." },
  { date: "2025-05-14", title: "Gomez, Rebeca 3° 4 Inasistencia",              category: "Alumnos", notes: "17 1/2 al 7/7: 30. Madre Firmó Acta. Va a pensar la posibilidad de cambiarla de escuela. Vive en C.A.B.A." },
  { date: "2025-05-28", title: "Ojeda Teo 3° 1 Inasistencia",                 category: "Alumnos", notes: "20 1/2. Nadia Jardel envió mail." },
  { date: "2025-08-29", title: "Díaz Mateo 3° 4 Inasistencias",               category: "Alumnos", notes: "15 inasistencias. Mail 28/5 - 29/5 Nadia habló con el papá. Pedí mail nuevo y que pasen a firmar acta. 02/06 firmó el acta la mamá. Tiene problemas de alergias y por eso tantas inasistencias." },
  { date: "2025-05-25", title: "Androchuk, Tiziano 5° 1 Inasistencia",        category: "Alumnos", notes: "19 3/4. Asprea Silvana envió mensaje, cuaderno y mail. Vendrán el lunes 9/6 a Firmar acta." },
  { date: "2025-06-06", title: "Ahumada, Demian 5° 1 Inasistencias",          category: "Alumnos", notes: "15 1/2. Asprea Silvana envió mail, por teléfono no contestan." },
  { date: "2025-06-06", title: "Alberio, Patricio 6° 1 Inasistencia",         category: "Alumnos", notes: "15 1/2. Asprea Silvana envió nota al cuaderno y un mail." },
  { date: "2025-06-05", title: "De Salvó, Alan 5° 1 Inasistencia",            category: "Alumnos", notes: "12,1/2. Asprea Silvana envió nota al cuaderno y un mail." },
  { date: "2025-06-06", title: "Fassolo Alvaro 5° 1 Inasistencia",            category: "Alumnos", notes: "12,1/2. Asprea Silvana envió nota en el cuaderno y un mail." },
  { date: "2025-06-06", title: "Gabriele, Joaquín 6° 1 Inasistencia",         category: "Alumnos", notes: "13 1/2. Asprea Silvana envió nota en el cuaderno y un mail." },
  { date: "2025-06-06", title: "Lovera, Bautista 5° 1 Inasistencia",          category: "Alumnos", notes: "14 1/2. Asprea Silvana envió nota en el cuaderno y un mail." },
  { date: "2025-06-06", title: "Zabala Joaquín 5° 1 Inasistencia",            category: "Alumnos", notes: "14. Asprea Silvana envió nota en el cuaderno y un mail. El alumno estuvo internado por Neumonía." },
  { date: "2025-06-06", title: "González Sotelo, 5° 1 inasistencia",          category: "Alumnos", notes: "13. Asprea Silvana envió nota en el cuaderno y un mail." },
  { date: "2025-06-06", title: "Delgado Sandoval, Martin 1° 5 Inasistencia",  category: "Alumnos", notes: "17 1/2. Medina, Nahia envió Email y whatsapp." },
  { date: "2025-06-06", title: "Esquivel, Brunella 1° 5 Inasistencia",        category: "Alumnos", notes: "9 1/2. Medina, Nahia envió Email." },
  { date: "2025-06-06", title: "Rios Pereyra, Liz 1° 5 inasistencia",         category: "Alumnos", notes: "12. Medina, Nahia envió Email." },
  { date: "2025-06-06", title: "Ginto, Ian 2° 1 inasistencia",                category: "Alumnos", notes: "11 1/2. Medina, Nahia Envió Email." },
  { date: "2025-06-06", title: "Miranda, Esperanza 2° 1 inasistencia",        category: "Alumnos", notes: "22. Medina, Nahia envió Email." },
  { date: "2025-06-06", title: "Morrone, Benjamin 2° 1 Inasistencia",         category: "Alumnos", notes: "20 1/2. Medina, Nahia envió Email." },
  { date: "2025-06-06", title: "Almeida, Lucila 2° 4 Inasistencia",           category: "Alumnos", notes: "11. Medina, Nahia envió email." },
  { date: "2025-06-06", title: "Ayala, Ian 2° 4° Inasistencias",              category: "Alumnos", notes: "12. Medina, Nahia envió email." },
  { date: "2025-06-06", title: "Brizola Urunaga, Ian 2° 4 Inasistencia",      category: "Alumnos", notes: "15 1/2. Medina, Nahia envió Email." },
  { date: "2025-06-06", title: "Castro Etchecopar, Maira 2° 4 Inasistencia",  category: "Alumnos", notes: "12. Medina, Nahia envió Email." },
  { date: "2025-08-29", title: "RENNER Benjamin 6° 1",                         category: "Alumnos", notes: "Se habló con el padre sobre las faltas, el rendimiento y la actitud del hijo. El mismo acusó que va a tener una conversación con el hijo." },
  { date: "2025-08-22", title: "Riquelme Fabricio 6° 1 Inasistencias",        category: "Alumnos", notes: "21 inasistencias. Edith habló con la madre y dice que se queda en la casa ayudándole con los hermanos." },
  { date: "2025-08-29", title: "Garcete 6° 1",                                 category: "Alumnos", notes: "Se habló con el alumno, dice estar mejor y que fue a psicólogo." },
  { date: "2025-08-29", title: "Fabricio Riquelme 6° 1",                      category: "Alumnos", notes: "Se habló con la familia sobre las faltas y la situación académica del alumno. Se llamó al alumno y se comprometió a revertir la situación. En cuanto a las faltas la familia admite que en ocasiones falta por una cuestión de organización familiar (cuida a su hermanita)." },
  { date: "2025-08-29", title: "Perzano Ezequiel 6° 1",                       category: "Alumnos", notes: "Se habló con la familia sobre las faltas y la situación académica del alumno. Se llamó al alumno y se comprometió a revertir la situación." },
  { date: "2025-08-29", title: "Boggini Agustín 7° 7 Inasistencias",          category: "Alumnos", notes: "23 1/2 inasistencias. Se llamo a la familia, 1 numero dice que es un abonado sin servicio. Al numero 1523629186 no atiende nadie." },
  { date: "2025-08-29", title: "Cabello Franco 7° 1 Inasistencias",           category: "Alumnos", notes: "48 inasistencias. El alumno vive con su padre en Glew. Según la madre el alumno no quiere cursar más escuela técnica." },
  { date: "2025-09-28", title: "Cabello Franco 7° 7 Inasistencias",           category: "Alumnos", notes: "48 inasistencias. El alumno vive con su padre en Glew. Según la madre el alumno no quiere cursar más escuela técnica." },
  { date: "2025-08-29", title: "Llana Hector 7° 7 Inasistencias",             category: "Alumnos", notes: "Tel: 1553783259. Se llama y cuando se dice que es del colegio cortan. Luego directamente buzón de voz." },
  { date: "2025-08-29", title: "Ruiz Díaz Jonathan Inasistencia",             category: "Alumnos", notes: "La mamá vino a firmar boletín el 21/8 y comentó que no tiene ganas de asistir. Post charla el alumno asiste pero de forma irregular." },
  { date: "2025-08-29", title: "Baranda Esteban 7° 1 Inasistencias",          category: "Alumnos", notes: "No concurre desde julio. Se habló con la madre. Se acercan el miércoles para dialogar sobre la situación del alumno." },
  { date: "2025-08-29", title: "Haedo Ximena 7° 1 Inasistencias",             category: "Alumnos", notes: "Se llamó a la casa, la familia no sabía que la alumna no concurría desde 17 de agosto." },
  { date: "2025-09-05", title: "Castro Victor Inasistencia",                   category: "Alumnos", notes: "Está en una pasantía. En la semana viene, se acerca la madre." },
  { date: "2025-09-05", title: "Ojeda Nicolas Inasistencias 6° 1",            category: "Alumnos", notes: "Se llamó pero no atienden." },
  { date: "2025-09-05", title: "Riquelme Fabricio Inasistencias",             category: "Alumnos", notes: "Se llama a la casa porque el alumno no asistió en toda la semana. Los padres no sabían." },
  { date: "2025-09-19", title: "4° 2da Ramiro Moreno",                         category: "Alumnos", notes: "Llamé por nota en el cuaderno pidiendo reunión. Vienen el miércoles 18:30." },
  { date: "2025-09-19", title: "Díaz Bautista Notas y Materias a recursar",   category: "Alumnos", notes: "Se volvió a llamar, no vinieron porque sufrieron la muerte del padre de la madre. Se acordó que pasan miércoles y jueves de la semana que viene." },
  { date: "2025-09-08", title: "Castro Victor",                                category: "Alumnos", notes: "Sigue sin venir, la madre se comprometió a venir esta semana." },
  { date: "2025-09-26", title: "CENTURION GUILLERMO ALEJANDRO 2° 4",          category: "Alumnos", notes: "Se envió nota a los docentes sobre dispositivo virtual." },
  { date: "2025-09-26", title: "MANUEL POLINA VERNARELLI 2° 5",               category: "Alumnos", notes: "Se envió nota a los docentes sobre dispositivo virtual." },
  { date: "2025-10-03", title: "Miglioretti",                                  category: "Alumnos", notes: "Se habló con la mamá por ausencias y porque cursaba una materia que no debía cursar." },
  { date: "2025-11-17", title: "Lopez Murillo 5° 1",                           category: "Otros",   notes: "Muchas faltas, el padre sabe y es porque se queda dormido. Viven solos ambos al estar separados y se está tratando de acostumbrar a que el alumno haga caso." },
  { date: "2025-11-12", title: "Castro Victor",                                category: "Alumnos", notes: "Se realizó una reunión con la madre, se comprometió a que el alumno asista." },
  { date: "2025-11-12", title: "Dominguez Lautaro 6° 2",                      category: "Alumnos", notes: "Se realizó una reunión con la madre, se comprometió a que el alumno asista." },
  { date: "2025-11-17", title: "Díaz Dante 4° 2",                             category: "Alumnos", notes: "Se realizó una reunión con la madre, se comprometió a que el alumno asista." },
  { date: "2025-11-13", title: "Nuñez Thiago 6° 7",                           category: "Otros",   notes: "Se realizó una reunión con el Padre, se comprometió a que el alumno asista." },
  { date: "2025-11-14", title: "Androchuk Tiziano 5° 7",                      category: "Alumnos", notes: "Se realizó una reunión con la madre, se comprometió a que el alumno asista." },
  { date: "2025-11-14", title: "Androchuk Tomas 5° 3",                        category: "Alumnos", notes: "Se realizó una reunión con la madre, se comprometió a que el alumno asista." },
  { date: "2025-11-26", title: "Cisneros Mirko 5° 7",                         category: "Alumnos", notes: "Se realizó una reunión con la madre, se comprometió a que el alumno asista." },
  { date: "2025-09-26", title: "Llana Hector 7° 7",                           category: "Otros",   notes: "No contestan." },
  { date: "2025-10-03", title: "Llana Hector 7° 7",                           category: "Otros",   notes: "No contestan." },
  { date: "2025-09-14", title: "Llana Hector 7° 7",                           category: "Alumnos", notes: "Llamé, no atienden." },
  { date: "2025-11-14", title: "Llana Hector 7° 7",                           category: "Alumnos", notes: "Llamé pero no atienden." },
  { date: "2025-07-19", title: "Ojeda Nicolas continua sin comunicación",      category: "Alumnos", notes: "Se realizó una reunión con la madre, se comprometió a que el alumno asista." },
  { date: "2025-11-12", title: "Ojeda Nicolás",                                category: "Alumnos", notes: "Llamamos y se comprometen a venir a hablar a la institución." },
  { date: "2025-12-26", title: "Ojeda Nicolas",                                category: "Otros",   notes: "Llamamos pero no nos atienden." },
  { date: "2026-04-14", title: "Persano 6° 1",                                 category: "Otros",   notes: "Se estuvo haciendo estudios médicos porque tiene problemas de riñones, mañana viene y la mamá manda todo por cuaderno de comunicaciones." },
  { date: "2026-04-14", title: "DIAZ SEBASTIAN AGUSTIN 6° 1",                 category: "Otros",   notes: "El alumno tiene licencia por quebradura, 30 días." },
  { date: "2026-04-14", title: "DIAZ BAUTISTA NAHUEL 6° 7ma",                 category: "Otros",   notes: "Se llamó para que firmen el acta, la madre se comprometió a venir el jueves." },
  { date: "2026-04-17", title: "Castro Victor 7° 7",                           category: "Otros",   notes: "Vino la madre a hablar, el alumno está trabajando en un taller mecánico y decidió no continuar con sus estudios." },
  { date: "2026-04-16", title: "Díaz Sebastián 6° 1",                         category: "Otros",   notes: "Se acercó la mamá, el alumno tiene 30 días más por la quebradura." },
  { date: "2026-04-22", title: "NAVEYRA ANAQUIN ANDRES 5° 7",                 category: "Otros",   notes: "Llamé nuevamente a los padres y no me atienden." },
  { date: "2026-04-22", title: "LOPEZ MURILLO MATHEO 6° 1",                   category: "Otros",   notes: "Se acercan a firmar el acta el viernes." },
  { date: "2026-04-22", title: "LOVERA BAUTISTA GABRIEL 6° 1",                category: "Otros",   notes: "Se acercan el viernes a firmar el acta." },
  { date: "2026-04-22", title: "DIAZ BAUTISTA NAHUEL 6° 7",                   category: "Otros",   notes: "Se volvió a llamar, la madre se comprometió a venir mañana a la mañana." },
  { date: "2026-04-22", title: "Riquelme FABRICIO 7° 1",                      category: "Otros",   notes: "Se comprometieron a asistir el viernes a firmar el acta." },
  { date: "2026-04-10", title: "Zuccolini Ibarra Lis 7° 7",                   category: "Otros",   notes: "No vienen a firmar el acta, la alumna dice que se encuentra sola porque la madre está de viaje." },
  { date: "2026-04-22", title: "Zuccolini Ibarra Lis 7° 7",                   category: "Otros",   notes: "Se llama al celular de la madre y continúa sin respuesta." },
]

const tsvNotes = tsvRows.map((r) => {
  const iso = toISO(r.date)
  return {
    id: genId(),
    text: `[${r.title}]\n${r.notes}`,
    categoryId: resolveCategoryId(r.category),
    tags: [],
    createdAt: iso,
    updatedAt: iso,
  }
})

// ─── Combine & output ────────────────────────────────────────────────────────
const allNotes = [...tableNotes, ...tsvNotes]

const output = {
  categories: CATEGORIES,
  notes: allNotes,
  reminders: [],
  lastSyncedAt: new Date().toISOString(),
}

writeFileSync("scripts/historical-data.json", JSON.stringify(output, null, 2))
console.log(`✓ Generated ${allNotes.length} historical notes → scripts/historical-data.json`)
