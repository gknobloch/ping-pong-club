/* eslint-disable react-refresh/only-export-components -- test utils, not app components */
import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { MockDataProvider } from '@/contexts/MockDataContext'

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MockDataProvider>{children}</MockDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: AllProviders,
    ...options,
  })
}

export * from '@testing-library/react'
export { customRender as render }
