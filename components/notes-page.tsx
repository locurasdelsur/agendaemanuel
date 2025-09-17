"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  GraduationCap,
  ClipboardList,
  Edit,
  Trash2,
} from "lucide-react"

export interface Task {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "completed"
  dueDate: string
  createdAt: string
}

export interface Student {
  id: string
  name: string
  course: string
  observations: string
  behavior: string
  performance: string
  createdAt: string
}

export interface Teacher {
  id: string
  name: string
  subject: string
  meetings: string
  agreements: string
  observations: string
  createdAt: string
}

interface NotesPageProps {
  onBack: () => void
}

const API_URL =
  "https://script.google.com/macros/s/AKfycbzBAk_J249SkVIrSvWlondANSXfNdcBVzxIu4RkSeWwEL5bOaH5KcIXDFcahSMArfot3w/exec"

export function NotesPage({ onBack }: NotesPageProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("tasks")
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showStudentDialog, setShowStudentDialog] = useState(false)
  const [showTeacherDialog, setShowTeacherDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const { toast } = useToast()

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    status: "pending" as Task["status"],
    dueDate: "",
  })

  // Student form state
  const [studentForm, setStudentForm] = useState({
    name: "",
    course: "",
    observations: "",
    behavior: "",
    performance: "",
  })

  // Teacher form state
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    subject: "",
    meetings: "",
    agreements: "",
    observations: "",
  })

  useEffect(() => {
    loadNotesData()
  }, [])

  const loadNotesData = async () => {
    try {
      console.log("[v0] Loading notes data from Google Sheets...")

      // Load tasks
      const tasksResponse = await fetch(`${API_URL}?type=tasks`)
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        console.log("[v0] Tasks data loaded:", tasksData)
        setTasks(Array.isArray(tasksData) ? tasksData : [])
      } else {
        console.log("[v0] Failed to load tasks data")
        setTasks([])
      }

      // Load students
      const studentsResponse = await fetch(`${API_URL}?type=students`)
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        console.log("[v0] Students data loaded:", studentsData)
        setStudents(Array.isArray(studentsData) ? studentsData : [])
      } else {
        console.log("[v0] Failed to load students data")
        setStudents([])
      }

      // Load teachers
      const teachersResponse = await fetch(`${API_URL}?type=teachers`)
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json()
        console.log("[v0] Teachers data loaded:", teachersData)
        setTeachers(Array.isArray(teachersData) ? teachersData : [])
      } else {
        console.log("[v0] Failed to load teachers data")
        setTeachers([])
      }
    } catch (error) {
      console.error("[v0] Error loading notes data:", error)
      setTasks([])
      setStudents([])
      setTeachers([])
    }
  }

  const saveToGoogleSheets = async (data: any, type: "tasks" | "students" | "teachers") => {
    try {
      console.log("[v0] Saving to Google Sheets:", { type, data })

      const formData = new URLSearchParams()
      formData.append("action", "add")
      formData.append("type", type)

      if (type === "tasks") {
        formData.append("title", data.title || "")
        formData.append("description", data.description || "")
        formData.append("dueDate", data.dueDate || "")
        formData.append("priority", data.priority || "")
        formData.append("status", data.status || "")
      } else if (type === "students") {
        formData.append("name", data.name || "")
        formData.append("course", data.course || "")
        formData.append("observations", data.observations || "")
        formData.append("behavior", data.behavior || "")
        formData.append("performance", data.performance || "")
      } else if (type === "teachers") {
        formData.append("name", data.name || "")
        formData.append("subject", data.subject || "")
        formData.append("meetings", data.meetings || "")
        formData.append("agreements", data.agreements || "")
        formData.append("observations", data.observations || "")
      }

      console.log("[v0] Form data being sent:", formData.toString())

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      })

      console.log("[v0] Response status:", response.status, "ok:", response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Save successful:", result)
        return result
      } else {
        const errorText = await response.text()
        console.error("[v0] Save failed with response:", errorText)
        throw new Error(`Failed to save to Google Sheets: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Error saving to Google Sheets:", error)
      throw error
    }
  }

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive",
      })
      return
    }

    const newTask: Task = {
      id: editingTask?.id || Date.now().toString(),
      ...taskForm,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
    }

    try {
      console.log("[v0] Attempting to save task:", newTask)

      if (!editingTask) {
        await saveToGoogleSheets(newTask, "tasks")
      }

      if (editingTask) {
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? newTask : t)))
        toast({
          title: "✅ Tarea actualizada",
          description: "La tarea se actualizó correctamente",
        })
      } else {
        setTasks((prev) => [...prev, newTask])
        toast({
          title: "✅ Tarea creada",
          description: "Nueva tarea agregada a la agenda",
        })
      }

      resetTaskForm()
      setShowTaskDialog(false)

      // Reload data after a short delay
      setTimeout(() => {
        loadNotesData()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea",
        variant: "destructive",
      })
    }
  }

  const handleSaveStudent = async () => {
    if (!studentForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }

    const newStudent: Student = {
      id: editingStudent?.id || Date.now().toString(),
      ...studentForm,
      createdAt: editingStudent?.createdAt || new Date().toISOString(),
    }

    try {
      console.log("[v0] Attempting to save student:", newStudent)

      if (!editingStudent) {
        await saveToGoogleSheets(newStudent, "students")
      }

      if (editingStudent) {
        setStudents((prev) => prev.map((s) => (s.id === editingStudent.id ? newStudent : s)))
        toast({
          title: "✅ Alumno actualizado",
          description: "La información del alumno se actualizó",
        })
      } else {
        setStudents((prev) => [...prev, newStudent])
        toast({
          title: "✅ Alumno agregado",
          description: "Nuevo alumno registrado en la agenda",
        })
      }

      resetStudentForm()
      setShowStudentDialog(false)

      // Reload data after a short delay
      setTimeout(() => {
        loadNotesData()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el alumno",
        variant: "destructive",
      })
    }
  }

  const handleSaveTeacher = async () => {
    if (!teacherForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }

    const newTeacher: Teacher = {
      id: editingTeacher?.id || Date.now().toString(),
      ...teacherForm,
      createdAt: editingTeacher?.createdAt || new Date().toISOString(),
    }

    try {
      console.log("[v0] Attempting to save teacher:", newTeacher)

      if (!editingTeacher) {
        await saveToGoogleSheets(newTeacher, "teachers")
      }

      if (editingTeacher) {
        setTeachers((prev) => prev.map((t) => (t.id === editingTeacher.id ? newTeacher : t)))
        toast({
          title: "✅ Docente actualizado",
          description: "La información del docente se actualizó",
        })
      } else {
        setTeachers((prev) => [...prev, newTeacher])
        toast({
          title: "✅ Docente agregado",
          description: "Nuevo docente registrado en la agenda",
        })
      }

      resetTeacherForm()
      setShowTeacherDialog(false)

      // Reload data after a short delay
      setTimeout(() => {
        loadNotesData()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el docente",
        variant: "destructive",
      })
    }
  }

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: "",
    })
    setEditingTask(null)
  }

  const resetStudentForm = () => {
    setStudentForm({
      name: "",
      course: "",
      observations: "",
      behavior: "",
      performance: "",
    })
    setEditingStudent(null)
  }

  const resetTeacherForm = () => {
    setTeacherForm({
      name: "",
      subject: "",
      meetings: "",
      agreements: "",
      observations: "",
    })
    setEditingTeacher(null)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    })
    setShowTaskDialog(true)
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setStudentForm({
      name: student.name,
      course: student.course,
      observations: student.observations,
      behavior: student.behavior,
      performance: student.performance,
    })
    setShowStudentDialog(true)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setTeacherForm({
      name: teacher.name,
      subject: teacher.subject,
      meetings: teacher.meetings,
      agreements: teacher.agreements,
      observations: teacher.observations,
    })
    setShowTeacherDialog(true)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    toast({
      title: "✅ Tarea eliminada",
      description: "La tarea se eliminó correctamente",
    })
  }

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId))
    toast({
      title: "✅ Alumno eliminado",
      description: "El registro del alumno se eliminó",
    })
  }

  const handleDeleteTeacher = (teacherId: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId))
    toast({
      title: "✅ Docente eliminado",
      description: "El registro del docente se eliminó",
    })
  }

  // Filter functions
  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.observations.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.observations.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getPriorityIcon = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4" />
      case "medium":
        return <Clock className="h-4 w-4" />
      case "low":
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "in-progress":
        return <Clock className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Agenda Digital</h1>
              <p className="text-muted-foreground">Gestiona tareas, alumnos y docentes</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar en tareas, alumnos o docentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tareas
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Alumnos
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Docentes
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Agenda de Tareas</h2>
              <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetTaskForm} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Tarea
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingTask ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="task-title">Título</Label>
                      <Input
                        id="task-title"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Título de la tarea"
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-description">Descripción</Label>
                      <Textarea
                        id="task-description"
                        value={taskForm.description}
                        onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Descripción detallada"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task-priority">Prioridad</Label>
                        <Select
                          value={taskForm.priority}
                          onValueChange={(value: Task["priority"]) =>
                            setTaskForm((prev) => ({ ...prev, priority: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="task-status">Estado</Label>
                        <Select
                          value={taskForm.status}
                          onValueChange={(value: Task["status"]) => setTaskForm((prev) => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="in-progress">En Progreso</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="task-due-date">Fecha Límite</Label>
                      <Input
                        id="task-due-date"
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveTask} className="flex-1">
                        {editingTask ? "Actualizar" : "Crear"} Tarea
                      </Button>
                      <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge className={`priority-${task.priority} flex items-center gap-1`}>
                            {getPriorityIcon(task.priority)}
                            {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                          </Badge>
                          <Badge className={`status-${task.status} flex items-center gap-1`}>
                            {getStatusIcon(task.status)}
                            {task.status === "completed"
                              ? "Completado"
                              : task.status === "in-progress"
                                ? "En Progreso"
                                : "Pendiente"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{task.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Fecha límite: {new Date(task.dueDate).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTask(task)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteTask(task.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Notas de Alumnos</h2>
              <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetStudentForm} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Alumno
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingStudent ? "Editar Alumno" : "Nuevo Alumno"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="student-name">Nombre</Label>
                      <Input
                        id="student-name"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Nombre completo del alumno"
                      />
                    </div>
                    <div>
                      <Label htmlFor="student-course">Curso</Label>
                      <Input
                        id="student-course"
                        value={studentForm.course}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, course: e.target.value }))}
                        placeholder="Ej: 5to Año A"
                      />
                    </div>
                    <div>
                      <Label htmlFor="student-behavior">Conducta</Label>
                      <Textarea
                        id="student-behavior"
                        value={studentForm.behavior}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, behavior: e.target.value }))}
                        placeholder="Observaciones sobre la conducta"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="student-performance">Rendimiento</Label>
                      <Textarea
                        id="student-performance"
                        value={studentForm.performance}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, performance: e.target.value }))}
                        placeholder="Notas y rendimiento académico"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="student-observations">Observaciones</Label>
                      <Textarea
                        id="student-observations"
                        value={studentForm.observations}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, observations: e.target.value }))}
                        placeholder="Observaciones generales"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveStudent} className="flex-1">
                        {editingStudent ? "Actualizar" : "Crear"} Alumno
                      </Button>
                      <Button variant="outline" onClick={() => setShowStudentDialog(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5" />
                          {student.name}
                        </CardTitle>
                        <p className="text-muted-foreground">{student.course}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Conducta</h4>
                        <p className="text-sm">{student.behavior}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Rendimiento</h4>
                        <p className="text-sm">{student.performance}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Observaciones</h4>
                        <p className="text-sm">{student.observations}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Notas de Docentes</h2>
              <Dialog open={showTeacherDialog} onOpenChange={setShowTeacherDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetTeacherForm} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Docente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingTeacher ? "Editar Docente" : "Nuevo Docente"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teacher-name">Nombre</Label>
                      <Input
                        id="teacher-name"
                        value={teacherForm.name}
                        onChange={(e) => setTeacherForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Nombre completo del docente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacher-subject">Materia</Label>
                      <Input
                        id="teacher-subject"
                        value={teacherForm.subject}
                        onChange={(e) => setTeacherForm((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder="Materia que enseña"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacher-meetings">Reuniones</Label>
                      <Textarea
                        id="teacher-meetings"
                        value={teacherForm.meetings}
                        onChange={(e) => setTeacherForm((prev) => ({ ...prev, meetings: e.target.value }))}
                        placeholder="Horarios y frecuencia de reuniones"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacher-agreements">Acuerdos</Label>
                      <Textarea
                        id="teacher-agreements"
                        value={teacherForm.agreements}
                        onChange={(e) => setTeacherForm((prev) => ({ ...prev, agreements: e.target.value }))}
                        placeholder="Acuerdos y compromisos"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacher-observations">Observaciones</Label>
                      <Textarea
                        id="teacher-observations"
                        value={teacherForm.observations}
                        onChange={(e) => setTeacherForm((prev) => ({ ...prev, observations: e.target.value }))}
                        placeholder="Observaciones generales"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveTeacher} className="flex-1">
                        {editingTeacher ? "Actualizar" : "Crear"} Docente
                      </Button>
                      <Button variant="outline" onClick={() => setShowTeacherDialog(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {filteredTeachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {teacher.name}
                        </CardTitle>
                        <p className="text-muted-foreground">{teacher.subject}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTeacher(teacher)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteTeacher(teacher.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Reuniones</h4>
                        <p className="text-sm">{teacher.meetings}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Acuerdos</h4>
                        <p className="text-sm">{teacher.agreements}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Observaciones</h4>
                        <p className="text-sm">{teacher.observations}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
