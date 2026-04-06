import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Points from "@/pages/Points";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Admin from "@/pages/Admin";
import AdminProducts from "@/pages/AdminProducts";
import AdminPoints from "@/pages/AdminPoints";
import AdminSecret from "@/pages/AdminSecret";
import AdminIncome from "@/pages/AdminIncome";
import AdminMigrate from "@/pages/AdminMigrate";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/providers/authContext";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Login />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/shop"
          element={
            <RequireAuth>
              <Shop />
            </RequireAuth>
          }
        />
        <Route
          path="/earn"
          element={
            <RequireAuth>
              <Points />
            </RequireAuth>
          }
        />
        <Route
          path="/product/:id"
          element={
            <RequireAuth>
              <ProductDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <Admin />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RequireAuth>
              <AdminProducts />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/points"
          element={
            <RequireAuth>
              <AdminPoints />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/secret"
          element={
            <RequireAuth>
              <AdminSecret />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/income"
          element={
            <RequireAuth>
              <AdminIncome />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/migrate"
          element={
            <RequireAuth>
              <AdminMigrate />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
