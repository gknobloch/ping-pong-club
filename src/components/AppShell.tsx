import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'

const prNumber = __PR_NUMBER__
const commitSha = __COMMIT_SHA__

function PreviewBanner() {
  if (!prNumber) return null
  const shortSha = commitSha ? commitSha.slice(0, 7) : ''
  return (
    <div className="bg-amber-500 text-white text-xs text-center py-1 px-4 font-medium">
      Preview — PR #{prNumber}{shortSha ? ` · ${shortSha}` : ''}
    </div>
  )
}

const navLinkClass = (active: boolean) =>
  `text-sm font-medium ${active ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`

export function AppShell() {
  const { user, displayName, roleLabel, logout } = useAuth()
  const { clubs } = useAppData()
  const navigate = useNavigate()
  const location = useLocation()
  const isGeneralAdmin = user?.role === 'general_admin'
  const isClubAdmin = user?.role === 'club_admin'

  const adminClubNames =
    user?.clubIds?.map((id) => clubs.find((c) => c.id === id)?.displayName).filter(Boolean).join(', ') ?? ''

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PreviewBanner />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="font-display text-lg font-semibold text-slate-800">
            Ping-Pong Club
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className={navLinkClass(location.pathname === '/')}>
              Accueil
            </Link>
            {isGeneralAdmin && (
              <>
                <Link to="/clubs" className={navLinkClass(location.pathname === '/clubs')}>
                  Clubs
                </Link>
                <Link to="/saisons" className={navLinkClass(location.pathname === '/saisons')}>
                  Saisons
                </Link>
                <Link to="/phases" className={navLinkClass(location.pathname === '/phases')}>
                  Phases
                </Link>
                <Link to="/divisions" className={navLinkClass(location.pathname === '/divisions')}>
                  Divisions
                </Link>
                <Link to="/groupes" className={navLinkClass(location.pathname === '/groupes')}>
                  Groupes
                </Link>
                <Link to="/equipes" className={navLinkClass(location.pathname === '/equipes')}>
                  Équipes
                </Link>
                <Link to="/journees" className={navLinkClass(location.pathname === '/journees')}>
                  Journées
                </Link>
              </>
            )}
            {(isClubAdmin || user?.role === 'captain' || user?.role === 'player') && !isGeneralAdmin && (
              <>
                {user?.clubIds?.length ? (
                  <Link to="/mon-club" className={navLinkClass(location.pathname === '/mon-club')}>
                    Mon club
                  </Link>
                ) : null}
                <Link to="/equipes" className={navLinkClass(location.pathname === '/equipes')}>
                  Équipes
                </Link>
                <Link to="/journees" className={navLinkClass(location.pathname === '/journees')}>
                  Journées
                </Link>
                <Link to="/joueurs" className={navLinkClass(location.pathname === '/joueurs')}>
                  Joueurs
                </Link>
              </>
            )}
            {isGeneralAdmin && (
              <Link to="/joueurs" className={navLinkClass(location.pathname === '/joueurs')}>
                Joueurs
              </Link>
            )}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right hidden sm:block">
                {(isClubAdmin || user?.role === 'captain' || user?.role === 'player') && !isGeneralAdmin && adminClubNames && (
                  <p className="text-xs font-medium text-slate-600">Club : {adminClubNames}</p>
                )}
                <p className="text-sm font-medium text-slate-800">{displayName}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Déconnexion
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {user ? <Outlet /> : null}
      </main>
    </div>
  )
}
