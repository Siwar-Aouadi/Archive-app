import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UploadPage.css";

function UploadPage() {
  const [file, setFile] = useState(null);
  const [titre, setTitre] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");

  const username = localStorage.getItem("username");
  const service = localStorage.getItem("service");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/categories`);
        setCategories(res.data);
      } catch (error) {
        console.error("Erreur chargement catégories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !username || !service || !titre || !category) {
      setMessage("❌ Tous les champs sont requis.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", username);
    formData.append("service", service);
    formData.append("titre", titre);
    formData.append("category", category);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(`✅ Document "${res.data.filename}" uploadé avec succès`);
      setFile(null);
      setTitre("");
      setCategory("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de l'envoi du fichier : " + (err.response?.data?.error || "Erreur inconnue"));
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">📤 Télécharger un document</h2>

      <form onSubmit={handleSubmit} className="upload-form">
        <input
          type="text"
          placeholder="Titre du document"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
          className="upload-input"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="select-category"
        >
          <option value="">📁 Sélectionner une catégorie</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          required
          className="upload-input"
        />

        <button type="submit" className="upload-button">
          📤 Télécharger le fichier
        </button>
      </form>

      {message && <p className="upload-message">{message}</p>}
    </div>
  );
}

export default UploadPage;
