import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { DataProvider } from '@/contexts/DataContext'
import { AppShell } from '@/components/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { ClubsPage } from '@/pages/admin/ClubsPage'
import { ClubDetailPage } from '@/pages/admin/ClubDetailPage'
import { SeasonsPage } from '@/pages/admin/SeasonsPage'
import { PhasesPage } from '@/pages/admin/PhasesPage'
import { DivisionsPage } from '@/pages/admin/DivisionsPage'
import { GroupsPage } from '@/pages/admin/GroupsPage'
import { TeamsPage } from '@/pages/admin/TeamsPage'
import { PlayersPage } from '@/pages/admin/PlayersPage'
import { MatchDaysPage } from '@/pages/admin/MatchDaysPage'
import { MyClubPage } from '@/pages/MyClubPage'

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
        <DataProvider>
          <Routes>
          <Route path="/login" element={<PublicRoute />} />
          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<HomePage />} />
            <Route path="clubs" element={<ClubsPage />} />
            <Route path="clubs/:affiliationNumber" element={<ClubDetailPage />} />
            <Route path="saisons" element={<SeasonsPage />} />
            <Route path="phases" element={<PhasesPage />} />
            <Route path="divisions" element={<DivisionsPage />} />
            <Route path="groupes" element={<GroupsPage />} />
            <Route path="equipes" element={<TeamsPage />} />
            <Route path="joueurs" element={<PlayersPage />} />
            <Route path="journees" element={<MatchDaysPage />} />
            <Route path="mon-club" element={<MyClubPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
