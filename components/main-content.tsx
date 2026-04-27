"use client"

import { useState, useEffect } from "react"
import { CalendarDays, Folder, BarChart3, Menu, Calendar, Download, History } from "lucide-react"
import { SearchBar } from "@/components/search-bar"
import { QuickAdd } from "@/components/quick-add"
import { TodayView } from "@/components/views/today-view"
import { CoursesView } from "@/components/views/courses-view"
import { DashboardView } from "@/components/views/dashboard-view"
import { CalendarView } from "@/components/views/calendar-view"
import { ImportExport } from "@/components/import-export"
import { HistoryView } from "@/components/history-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "@/components/app-sidebar"
import { useApp } from "@/lib/store"

type ViewType = "today" | "courses" | "dashboard" | "calendar" | "import-export" | "history"

export function MainContent() {
  const [activeView, setActiveView] = useState<ViewType>("today")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { syncWithCloud } = useApp()

  // Sync data when switching tabs
  useEffect(() => {
    syncWithCloud(false)
  }, [activeView, syncWithCloud])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="border-b bg-card px-4 py-3 flex items-center gap-4">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <SearchBar />
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <QuickAdd />

          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as ViewType)}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="today" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Hoy</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-2">
                <Folder className="h-4 w-4" />
                <span className="hidden sm:inline">Cursos</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="import-export" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Importar/Exportar</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-0">
              <TodayView />
            </TabsContent>
            <TabsContent value="calendar" className="mt-0">
              <CalendarView />
            </TabsContent>
            <TabsContent value="courses" className="mt-0">
              <CoursesView />
            </TabsContent>
            <TabsContent value="dashboard" className="mt-0">
              <DashboardView />
            </TabsContent>
            <TabsContent value="import-export" className="mt-0">
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Importar/Exportar Datos</h2>
                <ImportExport onImportSuccess={() => setActiveView("today")} />
              </div>
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Historial de Cambios</h2>
                <HistoryView limit={100} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
