import { BrowserRouter } from "react-router-dom"
import { Routes, Route } from "react-router-dom"
import StoryPage from "./pages/StoryPage"
import MapPage from "./pages/MapPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StoryPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App