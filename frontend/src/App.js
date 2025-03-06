import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import NavBar from './components/Navbar'
  
function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <NavBar/>
      <div className="pages">
        <Routes>
          <Route
            path="/"
            element={<Home/>}
          />
          <Route
            path="/dashboard"
            element={<Dashboard/>}
          />
        </Routes>
      </div>
      </BrowserRouter>
    </div>
  );
}

export default App;