import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { MockDataProvider } from '@/contexts/MockDataContext'
import { AppShell } from '@/components/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { ClubsPage } from '@/pages/admin/ClubsPage'
import { SeasonsPage } from '@/pages/admin/SeasonsPage'
import { PhasesPage } from '@/pages/admin/PhasesPage'
import { DivisionsPage } from '@/pages/admin/DivisionsPage'
import { GroupsPage } from '@/pages/admin/GroupsPage'
import { TeamsPage } from '@/pages/admin/TeamsPage'
import { PlayersPage } from '@/pages/admin/PlayersPage'

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <AppShell />
}

function PublicRoute() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <LoginPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MockDataProvider>
          <Routes>
          <Route path="/login" element={<PublicRoute />} />
          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<HomePage />} />
            <Route path="clubs" element={<ClubsPage />} />
            <Route path="saisons" element={<SeasonsPage />} />
            <Route path="phases" element={<PhasesPage />} />
            <Route path="divisions" element={<DivisionsPage />} />
            <Route path="groupes" element={<GroupsPage />} />
            <Route path="equipes" element={<TeamsPage />} />
            <Route path="joueurs" element={<PlayersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MockDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
