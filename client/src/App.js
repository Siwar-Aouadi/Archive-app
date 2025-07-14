import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import LoginForm from "./components/Loginform";
import UploadPage from "./components/UploadPage";
import AddUserForm from "./components/AddUserForm";
import CategoriesList from "./components/CategoriesList";
import CategoryDocuments from "./components/CategoryDocuments";
import AdminDashboard from "./components/AdminDashboard";
import AdminCategory from "./components/AdminCategory"; // ✅ Nouveau composant importé
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleLoginSuccess = (userRole) => {
    setIsAuthenticated(true);
    setRole(userRole);
    localStorage.setItem("role", userRole);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole("");
    localStorage.removeItem("role");
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  return (
    <Router>
      {!isAuthenticated ? (
        <Routes>
          <Route path="*" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
        </Routes>
      ) : (
        <div className="app-container">
          <header className="header">
            <div className="header-content">
              <h1>Tunisie Telecom Archive</h1>
              <nav className="nav-bar">
                <div className="nav-links">
                  <Link to="/upload">📤 Ajouter un fichier</Link>
                  <Link to="/documents">📄 Liste des fichiers</Link>
                  {role === "admin" && (
                    <>
                      <Link to="/admin">👥 Gérer utilisateurs</Link>
                      <Link to="/admin/categories">📂 Gérer catégories</Link> {/* ✅ Nouveau lien admin */}
                    </>
                  )}
                </div>
                <div className="nav-actions">
                  <button className="nav-btn" onClick={handleLogout}>Déconnexion</button>
                </div>
              </nav>
            </div>
          </header>
          <main>
            <Routes>
              <Route path="/upload" element={<UploadPage />} />
              <Route
                path="/documents"
                element={
                  selectedCategory ? (
                    <CategoryDocuments
                      category={selectedCategory}
                      onBack={handleBackToCategories}
                      role={role}
                    />
                  ) : (
                    <CategoriesList onSelectCategory={handleSelectCategory} />
                  )
                }
              />
              {role === "admin" && <Route path="/add_user" element={<AddUserForm />} />}
              {role === "admin" && <Route path="/admin" element={<AdminDashboard />} />}
              {role === "admin" && <Route path="/admin/categories" element={<AdminCategory />} />} {/* ✅ Route ajoutée */}
              <Route path="*" element={<Navigate to="/documents" />} />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  );
}

export default App;
