import { AppProvider } from "@/components/app-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { MainContent } from "@/components/main-content"

export default function Home() {
  return (
    <AppProvider>
      <div className="flex h-screen">
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        <MainContent />
      </div>
    </AppProvider>
  )
}
