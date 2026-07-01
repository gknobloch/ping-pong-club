import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataProvider, useAppData } from '@/contexts/DataContext'
import { mockClubs } from '@/mock/data'

const authState = vi.hoisted(() => ({
  devLogin: false,
  logout: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => ({
  get DEV_LOGIN() {
    return authState.devLogin
  },
  useAuth: () => ({ token: null, logout: authState.logout }),
}))

function Consumer() {
  const { clubs } = useAppData()
  return <div data-testid="clubs-count">{clubs.length}</div>
}

describe('DataProvider — API failure handling (#185)', () => {
  beforeEach(() => {
    authState.devLogin = false
    authState.logout.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('falls back to mock data when there is no real backend (dev/E2E)', async () => {
    authState.devLogin = true
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    render(
      <DataProvider>
        <Consumer />
      </DataProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('clubs-count').textContent).toBe(String(mockClubs.length))
    })
  })

  it('shows an error with a retry action instead of mock data when the API fails in production', async () => {
    authState.devLogin = false
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <DataProvider>
        <Consumer />
      </DataProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Impossible de charger les données. Vérifiez votre connexion.')
      ).toBeInTheDocument()
    })
    expect(screen.queryByTestId('clubs-count')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('logs the user out on a 401 instead of showing mock data or an error', async () => {
    authState.devLogin = false
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    )

    render(
      <DataProvider>
        <Consumer />
      </DataProvider>
    )

    await waitFor(() => expect(authState.logout).toHaveBeenCalledTimes(1))
    expect(
      screen.queryByText('Impossible de charger les données. Vérifiez votre connexion.')
    ).not.toBeInTheDocument()
  })
})
