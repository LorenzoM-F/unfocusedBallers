import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import Bracket from "./pages/Bracket";
import Teams from "./pages/Teams";
import Gallery from "./pages/Gallery";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPlayers from "./pages/admin/AdminPlayers";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminTournaments from "./pages/admin/AdminTournaments";
import AdminBracket from "./pages/admin/AdminBracket";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tournaments" element={<Tournaments />} />
        <Route path="tournaments/:id" element={<TournamentDetail />} />
        <Route path="bracket" element={<Bracket />} />
        <Route path="teams" element={<Teams />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="login" element={<Login />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="tournaments" element={<AdminTournaments />} />
          <Route path="bracket" element={<AdminBracket />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
