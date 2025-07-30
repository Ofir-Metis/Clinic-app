// src/pages/DashboardPage.spec.tsx

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardPage from './DashboardPage'
import * as api from '../api/dashboard'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Mock the API module
jest.mock('../api/dashboard')

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children }: any) => <a href={to}>{children}</a>,
  }
})

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading spinner initially', () => {
    // do not resolve the promises yet
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('fetches data and displays appointments, notes and stats cards', async () => {
    // Arrange: mock API calls
    const mockAppointments = [
      { id: 1, startTime: '2025-07-10T09:00:00Z', type: 'טיפול ראשון' },
    ]
    const mockNotes = [{ id: 2, content: 'פוסט טיפולי חשוב' }]
    const mockStats = {
      totalClients: 5,
      sessionsThisWeek: 2,
      pendingTasks: 3,
    }
    ;(api.fetchAppointments as jest.Mock).mockResolvedValue(mockAppointments)
    ;(api.fetchNotes as jest.Mock).mockResolvedValue(mockNotes)
    ;(api.fetchStats as jest.Mock).mockResolvedValue(mockStats)

    // Act
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Assert: wait for loading to finish
    await waitFor(() => expect(api.fetchAppointments).toHaveBeenCalled())
    await waitFor(() => expect(api.fetchNotes).toHaveBeenCalled())
    await waitFor(() => expect(api.fetchStats).toHaveBeenCalled())

    // Check that the appointments list item appears
    expect(
      screen.getByText(new Date(mockAppointments[0].startTime).toLocaleString('he-IL'))
    ).toBeInTheDocument()
    expect(screen.getByText(mockAppointments[0].type)).toBeInTheDocument()

    // Check that the note appears
    expect(screen.getByText(mockNotes[0].content)).toBeInTheDocument()

    // Check that stats are displayed
    expect(screen.getByText(`מס' מטופלים: ${mockStats.totalClients}`)).toBeInTheDocument()
    expect(
      screen.getByText(`פגישות השבוע: ${mockStats.sessionsThisWeek}`)
    ).toBeInTheDocument()
    expect(screen.getByText(`משימות פתוחות: ${mockStats.pendingTasks}`)).toBeInTheDocument()
  })

  it('navigates when drawer item clicked (desktop)', async () => {
    ;(api.fetchAppointments as jest.Mock).mockResolvedValue([])
    ;(api.fetchNotes as jest.Mock).mockResolvedValue([])
    ;(api.fetchStats as jest.Mock).mockResolvedValue({})

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for loading to complete
    await waitFor(() => expect(api.fetchAppointments).toHaveBeenCalled())

    // Click on "Clients" link
    const clientsLink = screen.getByText('Clients')
    fireEvent.click(clientsLink)

    expect(mockNavigate).toHaveBeenCalledWith('/patients')
  })

  it('shows bottom navigation and FAB on mobile', async () => {
    // Force mobile viewport
    window.innerWidth = 375
    window.dispatchEvent(new Event('resize'))

    ;(api.fetchAppointments as jest.Mock).mockResolvedValue([])
    ;(api.fetchNotes as jest.Mock).mockResolvedValue([])
    ;(api.fetchStats as jest.Mock).mockResolvedValue({})

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => expect(api.fetchAppointments).toHaveBeenCalled())

    // Check bottom nav items (English labels)
    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Clients')).toBeInTheDocument()
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
    expect(screen.getByLabelText('Settings')).toBeInTheDocument()

    // Check FAB
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/appointments/new')
  })
})
