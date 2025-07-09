import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import LoginForm from "./components/Loginform";
import UploadPage from "./components/UploadPage";
import AddUserForm from "./components/AddUserForm";
import CategoriesList from "./components/CategoriesList"; // liste des sources
import CategoryDocuments from "./components/CategoryDocuments"; // fichiers d’une catégorie avec détails
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleLoginSuccess = (userRole) => {
    setIsAuthenticated(true);
    setRole(userRole);
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
              <h1>Tunisie telecom archive</h1>
              <nav className="nav-bar">
                <div className="nav-links">
                  <Link to="/upload">📤 Ajouter un fichier</Link>
                  <Link to="/documents">📄 Liste des fichiers</Link>
                  {role === "admin" && <Link to="/add_user">👤 Ajouter utilisateur</Link>}
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
              <Route path="*" element={<Navigate to="/documents" />} />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  );
}

export default App;
