import { createBrowserRouter, RouterProvider } from "react-router-dom"
import StoryPage from "./pages/StoryPage"
import About from "./pages/About"
import MapPage from "./pages/MapPage"

const router = createBrowserRouter([
  { path: "/", element: <StoryPage /> },
  { path: "/about", element: <About /> },
  { path: "/map", element: <MapPage /> },
], {
  basename: "/dair-pharmacy-app/"
})

function App() {
  return <RouterProvider router={router} />
}

export default App