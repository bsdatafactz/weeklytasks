import { Route, Routes } from 'react-router-dom'
import ChatView from './components/ChatView.jsx'
import AdminView from './components/AdminView.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'

function App() {
  return (
    <>
      {/* Fixed-position, rendered once here rather than per-page -- guarantees the
          exact same spot regardless of each page's own layout/content height. */}
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<ChatView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </>
  )
}

export default App
