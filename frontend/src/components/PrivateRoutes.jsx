import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const access = localStorage.getItem("access");
  return access ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
