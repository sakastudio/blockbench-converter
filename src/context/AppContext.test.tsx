import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'

// Test component that uses the context
function TestComponent() {
  const { state, actions } = useApp()

  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="resolution">{state.options.resolution}</span>
      <button onClick={() => actions.updateOptions({ resolution: 32 })}>
        Update Resolution
      </button>
      <button onClick={actions.reset}>Reset</button>
    </div>
  )
}

describe('AppContext', () => {
  describe('AppProvider', () => {
    it('should provide initial state', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      )

      expect(screen.getByTestId('status').textContent).toBe('idle')
      expect(screen.getByTestId('resolution').textContent).toBe('16')
    })

    it('should allow updating options', async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      )

      const button = screen.getByText('Update Resolution')

      await act(async () => {
        button.click()
      })

      expect(screen.getByTestId('resolution').textContent).toBe('32')
    })

    it('should allow resetting state', async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      )

      // First update resolution
      const updateButton = screen.getByText('Update Resolution')
      await act(async () => {
        updateButton.click()
      })
      expect(screen.getByTestId('resolution').textContent).toBe('32')

      // Then reset
      const resetButton = screen.getByText('Reset')
      await act(async () => {
        resetButton.click()
      })
      expect(screen.getByTestId('resolution').textContent).toBe('16')
    })
  })

  describe('useApp', () => {
    it('should throw when used outside provider', () => {
      // Suppress error output for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useApp must be used within an AppProvider')

      consoleSpy.mockRestore()
    })
  })
})
