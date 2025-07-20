import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard"
import PrivateRoute from "./components/PrivateRoutes";
import Navbar from "./components/navbar";
import CreateShort from "./pages/CreateShort";
import ListMyVideos from "./pages/ListMyVidioes";
export default function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-short" element={<CreateShort />} />
        <Route path="/list-vidioes" element={<ListMyVideos />} />
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
