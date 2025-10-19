import {Toaster, toast} from 'sonner'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from './pages/HomePage.jsx'
function App() {
  

  return (
    <>
      <Toaster position="top-right" /> <button onClick={()=> toast("helo")}></button>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
