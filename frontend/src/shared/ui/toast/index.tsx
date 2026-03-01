import { create } from 'zustand'

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type ToastType = 'success' | 'warning' | 'attention'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

/* ------------------------------------------------------------------ */
/*  Store                                                               */
/* ------------------------------------------------------------------ */

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      4000,
    )
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/* ------------------------------------------------------------------ */
/*  Toast colours                                                       */
/* ------------------------------------------------------------------ */

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-500 text-white',
  attention: 'bg-blue-500 text-white',
}

/* ------------------------------------------------------------------ */
/*  ToastContainer                                                      */
/* ------------------------------------------------------------------ */

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          onClick={() => removeToast(toast.id)}
          className={`flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ${TOAST_STYLES[toast.type]}`}
        >
          {toast.type === 'success' && <span>✓</span>}
          {toast.type === 'warning' && <span>⚠</span>}
          {toast.type === 'attention' && <span>ℹ</span>}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
