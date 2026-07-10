import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Shared dialog behaviour for every modal (GameQuickView, admin edit modals,
// the avatar lightbox): Escape closes, Tab is trapped inside the dialog, and
// focus returns to the trigger on close. Renders the backdrop element — pass
// the existing backdrop classes via `className` and the card as children.
export function ModalShell({
  onClose,
  children,
  className,
  labelledBy,
  label,
  closeOnBackdrop = false,
}: {
  onClose: () => void
  children: React.ReactNode
  /** Backdrop classes (the old `fixed inset-0 …` container). */
  className?: string
  labelledBy?: string
  label?: string
  /** Close when the backdrop itself is clicked (not the card). */
  closeOnBackdrop?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Keep the latest onClose without re-running the mount effect (callers pass
  // inline arrows; re-running would steal focus from form fields on each render).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = ref.current
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = () =>
      dialog ? [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)] : []
    ;(focusables()[0] ?? dialog)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const els = focusables()
      if (els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={label}
      tabIndex={-1}
      className={className}
      onClick={closeOnBackdrop ? (e) => e.target === e.currentTarget && onClose() : undefined}
    >
      {children}
    </div>
  )
}
