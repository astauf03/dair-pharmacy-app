import { BrowserRouter } from "react-router-dom"
import { Routes, Route } from "react-router-dom"
import StoryPage from "./pages/StoryPage"
import About from "./pages/About"
import MapPage from "./pages/MapPage"

function App() {
  return (
    <BrowserRouter basename="/dair-pharmacy-app/">
      <Routes>
        <Route path="/" element={<StoryPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App