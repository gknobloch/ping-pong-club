import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('renders title and user search', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /Disponibilités Ping-Pong/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Utilisateur/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Nom ou adresse email/i)).toBeInTheDocument()
  })

  it('shows dev mode message', () => {
    render(<LoginPage />)
    expect(screen.getByText(/Mode développement/i)).toBeInTheDocument()
  })
})
