import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Categories.css";

function CategoriesList({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/categories`);
        setCategories(res.data); // ✅ Liste directe de catégories venant de MongoDB
      } catch (error) {
        console.error("Erreur fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <p className="loading-text">Chargement des catégories...</p>;

  if (categories.length === 0)
    return (
      <div className="categories-container">
        <h2 className="categories-title">Aucune catégorie disponible</h2>
      </div>
    );

  return (
    <div className="categories-container">
      <h2 className="categories-title">Catégories de documents</h2>

      <input
        type="text"
        placeholder="🔍 Rechercher une catégorie..."
        value={search}
        onChange={(e) => setSearch(e.target.value.toLowerCase())}
        className="search-input"
      />

      <ul className="list">
        {categories
          .filter((cat) => cat.toLowerCase().includes(search))
          .map((cat) => (
            <li
              key={cat}
              className="list-item"
              onClick={() => onSelectCategory(cat)}
              title={`Voir les fichiers de ${cat}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelectCategory(cat)}
            >
              <div className="list-item-title">📁 {cat}</div>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default CategoriesList;
