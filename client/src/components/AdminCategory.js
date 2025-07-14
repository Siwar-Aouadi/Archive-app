import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Categories.css";

function AdminCategory() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [message, setMessage] = useState("");

  const role = localStorage.getItem("role");

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/categories`);
      setCategories(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories :", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const formData = new FormData();
      formData.append("name", newCategory);
      formData.append("role", role);

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/categories`, formData);
      setMessage(res.data.message);
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Erreur lors de l'ajout");
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API_URL}/delete_category/${categoryName}`, {
        params: { username: localStorage.getItem("username"), role }
      });
      alert(res.data.message);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || "❌ Échec de suppression");
    }
  };

  return (
    <div className="categories-container">
      <h2 className="categories-title">🔐 Gestion des catégories</h2>

      <input
        type="text"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
        placeholder="➕ Nouvelle catégorie"
        className="search-input"
      />
      <button onClick={handleAddCategory} className="add-button">
        ✅ Ajouter Catégorie
      </button>

      {message && <p>{message}</p>}

      <ul className="list">
        {categories.map((cat) => (
          <li key={cat} className="list-item">
            <div className="list-item-title">📁 {cat}</div>
            <button
              className="delete-button"
              onClick={() => handleDeleteCategory(cat)}
            >
              🗑️ Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminCategory;
