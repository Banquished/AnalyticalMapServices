import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, info.componentStack)
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-bg text-text">
          <div className="max-w-md text-center p-8">
            <h1 className="text-xl font-semibold mb-2">Noe gikk galt</h1>
            <p className="text-text-muted text-sm mb-4">
              En uventet feil oppsto. Last inn siden på nytt for å prøve igjen.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              Last inn på nytt
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
