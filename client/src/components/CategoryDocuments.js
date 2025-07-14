import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Categories.css";

function CategoryDocuments({ category, onBack }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [fileSearch, setFileSearch] = useState("");

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const service = localStorage.getItem("service");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/documents`, {
          params: { username, role, service }
        });
        const filtered = res.data.filter(doc => 
          doc.category?.toLowerCase() === category.toLowerCase()
        );
        setDocuments(filtered);
      } catch (error) {
        console.error("Erreur fetch fichiers:", error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [category]);

  const handleDownload = (filename) => {
    window.open(`${process.env.REACT_APP_API_URL}/download/${filename}`, "_blank");
  };

  const handleDelete = async (filename) => {
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API_URL}/delete/${filename}`, {
        params: { username, role },
      });
      alert(res.data.message);
      setDocuments(docs => docs.filter(d => d.filename !== filename));
    } catch (err) {
      alert("❌ Suppression échouée : " + (err.response?.data?.error || "Erreur inconnue"));
    }
  };

  const openEditModal = (doc) => {
    setEditingFile(doc);
    setNewFile(null);
  };

  const handleUpdate = async () => {
    if (!newFile) {
      alert("📁 Veuillez sélectionner un nouveau fichier.");
      return;
    }

    const formData = new FormData();
    formData.append("file", newFile);
    formData.append("username", username);
    formData.append("role", role);

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/update/${editingFile.filename}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(res.data.message);
      setEditingFile(null);
      setNewFile(null);

      const refreshed = await axios.get(`${process.env.REACT_APP_API_URL}/documents`, {
        params: { username, role, service }
      });
      const filtered = refreshed.data.filter(doc =>
        doc.category?.toLowerCase() === category.toLowerCase()
      );
      setDocuments(filtered);
    } catch (err) {
      alert("❌ Erreur de mise à jour : " + (err.response?.data?.error || "Erreur inconnue"));
    }
  };

  if (loading)
    return (
      <div className="categories-container">
        <button className="back-button" onClick={onBack}>← Retour </button>
        <p className="loading-text">Chargement des fichiers...</p>
      </div>
    );

  return (
    <div className="categories-container">
      <button className="back-button" onClick={onBack}>← Retour</button>
      <h2 className="categories-title">Fichiers dans : {category}</h2>

      <input
        type="text"
        placeholder="🔍 Rechercher un fichier..."
        value={fileSearch}
        onChange={(e) => setFileSearch(e.target.value.toLowerCase())}
        className="search-input"
      />

      {documents.length === 0 ? (
        <p className="no-files-msg">Aucun fichier dans cette catégorie.</p>
      ) : (
        <ul className="list">
          {documents
            .filter(doc => doc.filename.toLowerCase().includes(fileSearch))
            .map(doc => (
              <li key={doc.filename} className="list-item" title={doc.filename}>
                <div className="list-item-title">📄 {doc.filename}</div>
                <div>👤 Uploader : <strong>{doc.uploaded_by || "Inconnu"}</strong></div>

                <div className="button-row">
                  <button className="download-button" onClick={() => handleDownload(doc.filename)}>📥 Télécharger</button>

                  {(role === "admin" || doc.uploaded_by?.toLowerCase() === username?.toLowerCase()) && (
                    <>
                      <button className="icon-button" onClick={() => openEditModal(doc)}>✏️</button>
                      <button className="icon-button delete" onClick={() => handleDelete(doc.filename)}>🗑️</button>
                    </>
                  )}
                </div>
              </li>
            ))}
        </ul>
      )}

      {editingFile && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>✏️ Remplacer le fichier</h3>
            <input
              type="file"
              onChange={e => setNewFile(e.target.files[0])}
            />
            <div className="modal-buttons">
              <button onClick={handleUpdate} className="edit-button">✅ Enregistrer</button>
              <button onClick={() => setEditingFile(null)} className="delete-button">❌ Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryDocuments;
