"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const Navbar = () => {
  const navigate = useNavigate()
  const user = localStorage.getItem("user")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    navigate("/login")
    setIsSidebarOpen(false) 
  }

  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center shadow-md">
        <Link to="/" className="text-xl font-bold">
          MyApp
        </Link>

        <div className="hidden md:flex gap-6 items-center">
          <Link to="/" className="hover:text-gray-300 transition-colors">
            Home
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-gray-300 transition-colors">
                Dashboard
              </Link>
              <Link to="/create-short" className="hover:text-gray-300 transition-colors">
                Create Short
              </Link>
              <Link to="/list-vidioes" className="hover:text-gray-300 transition-colors">
                List Videos
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300 transition-colors">
                Login
              </Link>
              <Link to="/register" className="hover:text-gray-300 transition-colors">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button (Hamburger) */}
        <button
          className="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-white rounded"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open mobile menu"
        >
          <div className="w-6 h-0.5 bg-white mb-1"></div>
          <div className="w-6 h-0.5 bg-white mb-1"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} aria-hidden="true"></div>
      )}

      {/* Mobile Sidebar Content */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-gray-900 text-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}
          md:hidden`}
      >
        <div className="p-4 flex justify-end">
          <button
            className="text-white text-2xl focus:outline-none"
            onClick={closeSidebar}
            aria-label="Close mobile menu"
          >
            &times; {/* X icon */}
          </button>
        </div>
        <div className="flex flex-col p-4 space-y-4">
          <Link to="/" className="hover:text-gray-300 text-lg" onClick={closeSidebar}>
            Home
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-gray-300 text-lg" onClick={closeSidebar}>
                Dashboard
              </Link>
              <Link to="/create-short" className="hover:text-gray-300 text-lg" onClick={closeSidebar}>
                Create Short
              </Link>
              <Link to="/list-vidioes" className="hover:text-gray-300 text-lg" onClick={closeSidebar}>
                List Videos
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300 text-lg" onClick={closeSidebar}>
                Login
              </Link>
              <Link to="/register" className="hover:text-gray-300 text-lg" onClick={closeSidebar}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Navbar
