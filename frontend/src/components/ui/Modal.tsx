import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
}

/** Longest close animation in index.css, plus margin — a fallback if animationend never fires. */
const CLOSE_FALLBACK_MS = 400

/**
 * Native <dialog>: focus trap, Esc-to-close and an inert background come for free.
 * On phones it is a bottom sheet (full width, slides up, within thumb reach);
 * from `sm` up it is a centred card.
 *
 * A native dialog closes instantly, so closing is staged: a `closing` class
 * plays the exit animation (index.css) and the dialog really closes when it
 * ends. Content stays rendered until then, so the sheet doesn't empty mid-slide.
 */
export function Modal({ open, title, eyebrow, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [rendered, setRendered] = useState(open)

  // Keep children mounted from the moment it opens (React's derive-during-render pattern).
  if (open && !rendered) setRendered(true)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open) {
      dialog.classList.remove('closing') // reopened mid-exit: cancel the exit
      if (!dialog.open) dialog.showModal()
      return
    }

    if (!dialog.open) return
    dialog.classList.add('closing')
    const finish = (e?: Event) => {
      if (e && e.target !== dialog) return // an animation inside the sheet bubbled up
      if (!dialog.classList.contains('closing')) return // reopened meanwhile
      dialog.classList.remove('closing')
      dialog.close()
      setRendered(false)
    }
    // Not { once: true }: a bubbled child animationend must not use up the listener.
    dialog.addEventListener('animationend', finish)
    const fallback = setTimeout(() => finish(), CLOSE_FALLBACK_MS)
    return () => {
      dialog.removeEventListener('animationend', finish)
      clearTimeout(fallback)
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      // Esc would close the dialog natively (instantly); route it through onClose to animate.
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="sheet mx-0 mb-0 mt-auto w-full max-w-none rounded-t-2xl border border-b-0 border-border border-t-2 border-t-accent bg-card p-0 text-foreground shadow-lg backdrop:bg-foreground/30 backdrop:backdrop-blur-[2px] sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-xl sm:rounded-lg sm:border-b"
    >
      <div className="max-h-[90dvh] overflow-y-auto overscroll-contain px-5 pt-3 sm:max-h-[85vh] sm:p-10">
        {/* Grab handle: tells a phone user this is a sheet they can dismiss. */}
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
        <header className="mb-6 flex items-start justify-between gap-6 sm:mb-8">
          <div className="min-w-0">
            {eyebrow && <p className="small-caps mb-1 text-accent sm:mb-2">{eyebrow}</p>}
            <h2 className="truncate text-2xl sm:text-3xl">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 grid size-11 shrink-0 touch-manipulation place-items-center rounded-md text-2xl leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ×
          </button>
        </header>
        {(open || rendered) && children}
        {/* Clears the iPhone home indicator at the bottom of the sheet. */}
        <div aria-hidden className="h-[max(1.25rem,env(safe-area-inset-bottom))] sm:hidden" />
      </div>
    </dialog>
  )
}
