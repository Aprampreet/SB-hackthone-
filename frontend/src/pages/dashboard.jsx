import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const storedUser = localStorage.getItem("user");
  let user = null;
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.clear();
    user = null;
  }

  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome, {user?.username || "Guest"} 🎉</h1>
        <p className="text-gray-600 mb-6">You're logged in and ready to explore the dashboard!</p>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
