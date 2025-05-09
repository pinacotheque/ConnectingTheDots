import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import SpaceDetail from "./pages/SpaceDetail";
import Navigation from "./components/Navigation";

function LayoutWithNavbar({ children }) {
  const location = useLocation();
  const hideNavbar = ["/login", "/register"].includes(location.pathname);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSpaceCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      {!hideNavbar && <Navigation onSpaceCreated={handleSpaceCreated} />}
      {React.cloneElement(children, { key: refreshKey })}
    </>
  );
}

function App() {
  return (
    <Router>
      <LayoutWithNavbar>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/spaces/:spaceId" element={<SpaceDetail />} />
        </Routes>
      </LayoutWithNavbar>
    </Router>
  );
}

export default App;
