import { Component, Suspense, lazy, type ReactNode } from 'react'
import { homeURL } from './games/shared/integration'

const pages = {
  'kimi-cairn': lazy(() => import('./games/cairn/CairnPage')),
  'kimi-morph': lazy(() => import('./games/morph/MorphPage')),
  'kimi-tangle': lazy(() => import('./games/tangle/TanglePage')),
  'kimi-hunch': lazy(() => import('./games/hunch/HunchPage')),
  'kimi-circuit': lazy(() => import('./games/circuit/CircuitPage')),
  'kimi-quartet': lazy(() => import('./games/quartet/QuartetPage')),
}
class GameBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main className="integration-error">
      <h1>This game needs a fresh start.</h1>
      <p>Your other games and their results are safe. Reload to try again.</p>
      <button type="button" onClick={() => location.reload()}>Reload game</button>
      <a href={homeURL()}>Back to all games</a>
    </main>
    return this.props.children
  }
}
export default function App() {
  const id = document.documentElement.dataset.gameId as keyof typeof pages
  const Page = pages[id]
  if (!Page) return <main className="integration-error"><h1>Choose a daily game.</h1><a href={homeURL()}>Back to all games</a></main>
  return <GameBoundary><Suspense fallback={<p className="integration-loading" role="status">Getting your puzzle ready…</p>}><Page /></Suspense></GameBoundary>
}
