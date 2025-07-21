import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Categories.css";

function CategoriesList({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [filtered, setFiltered] = useState(false);

  const [filters, setFilters] = useState({
    year: "",
    month: "",
    day: "",
    service: "",
    category: ""
  });

  const [services, setServices] = useState([]);
  const [years, setYears] = useState([]);
  const [months] = useState(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]);
  const [days] = useState(Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')));

  const role = localStorage.getItem("role");

  useEffect(() => {
    // Charger les catégories
    axios.get(`${process.env.REACT_APP_API_URL}/categories`)
      .then(res => setCategories(res.data))
      .catch(err => console.error("Erreur fetch categories:", err));

    // Charger toutes les années disponibles (par exemple 2023–2026)
    const thisYear = new Date().getFullYear();
    setYears([thisYear - 1, thisYear, thisYear + 1]);

    // Charger les services uniques depuis les documents
    axios.get(`${process.env.REACT_APP_API_URL}/documents`, { params: { role } })
      .then(res => {
        const allServices = Array.from(new Set(res.data.map(doc => doc.service))).filter(Boolean);
        setServices(allServices);
      })
      .catch(err => console.error("Erreur fetch services:", err));
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilter = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/documents`, {
        params: {
          ...filters,
          role
        }
      });
      setDocuments(res.data);
      setFiltered(true);
    } catch (err) {
      console.error("Erreur lors du filtrage :", err);
    }
  };

  return (
    <div className="categories-container">
      <h2 className="categories-title">🔍 Filtrer les documents</h2>

      <div className="filter-bar">

        <select name="year" value={filters.year} onChange={handleChange}>
          <option value="">Année</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select name="month" value={filters.month} onChange={handleChange}>
          <option value="">Mois</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select name="day" value={filters.day} onChange={handleChange}>
          <option value="">Jour</option>
          {days.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select name="service" value={filters.service} onChange={handleChange}>
          <option value="">Service</option>
          {services.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select name="category" value={filters.category} onChange={handleChange}>
          <option value="">Catégorie</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button onClick={handleFilter}>🔎 Rechercher</button>
      </div>

      {filtered ? (
        <>
          <h3 className="categories-title">📄 Résultats filtrés</h3>
          <ul className="list">
            {documents.length === 0 ? (
              <p>Aucun fichier trouvé pour ces filtres.</p>
            ) : (
              documents.map((doc, index) => (
                <li key={index} className="list-item">
                  <div className="list-item-title">📄 {doc.filename}</div>
                  <div>👤 {doc.uploaded_by} | 🗂️ {doc.category} | 🏢 {doc.service}</div>
                </li>
              ))
            )}
          </ul>
        </>
      ) : (
        <>
          <h2 className="categories-title">📂 Catégories disponibles</h2>
          <ul className="list">
            {categories.map((cat) => (
              <li
                key={cat}
                className="list-item"
                onClick={() => onSelectCategory(cat)}
                role="button"
              >
                <div className="list-item-title">📁 {cat}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default CategoriesList;
