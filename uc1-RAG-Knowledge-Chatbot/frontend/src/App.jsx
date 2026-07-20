import { Route, Routes } from 'react-router-dom'
import ChatView from './components/ChatView.jsx'
import AdminView from './components/AdminView.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatView />} />
      <Route path="/admin" element={<AdminView />} />
    </Routes>
  )
}

export default App
