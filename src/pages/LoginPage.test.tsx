import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('renders the email sign-in step', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /Disponibilités Ping-Pong/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Adresse e-mail/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Recevoir un code/i })).toBeInTheDocument()
  })

  it('offers Google and Apple sign-in', () => {
    render(<LoginPage />)
    // Not configured in tests -> rendered as disabled "à configurer" buttons.
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Apple/i })).toBeInTheDocument()
  })

  it('shows the dev login picker in dev mode', () => {
    render(<LoginPage />)
    expect(screen.getByText(/Mode développement/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Nom ou adresse email/i)).toBeInTheDocument()
  })
})
