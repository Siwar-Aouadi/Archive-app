import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Categories.css";

function CategoryDocuments({ category, onBack }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [fileSearch, setFileSearch] = useState("");

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/documents`);
        const filtered = res.data.filter((doc) => {
          let sourceName = "Autres";
          try {
            const parts = doc.filename.split(" ", 2);
            if (parts.length > 1) {
              sourceName = parts[1].split(".")[0];
            }
          } catch {
            sourceName = "Autres";
          }
          return sourceName === category;
        });
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
      setDocuments((docs) => docs.filter((d) => d.filename !== filename));
    } catch (err) {
      alert("❌ Suppression échouée : " + (err.response?.data?.error || "Erreur inconnue"));
    }
  };

  const openEditModal = (doc) => {
    setEditingFile(doc);
    setNewTitle(doc.title || doc.filename);
    setNewDescription(doc.description);
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/update/${editingFile.filename}`, {
        title: newTitle, description: newDescription },
        { params: { username, role } }
      );
      alert(res.data.message);
      setEditingFile(null);
      const refreshed = await axios.get(`${process.env.REACT_APP_API_URL}/documents`);
      const filtered = refreshed.data.filter((doc) => {
        let sourceName = "Autres";
        try {
          const parts = doc.filename.split(" ", 2);
          if (parts.length > 1) {
            sourceName = parts[1].split(".")[0];
          }
        } catch {
          sourceName = "Autres";
        }
        return sourceName === category;
      });
      setDocuments(filtered);
    } catch (err) {
      alert("❌ Erreur de mise à jour");
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

      {/* 🔍 Barre de recherche */}
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
            .filter((doc) =>
              doc.filename.toLowerCase().includes(fileSearch) ||
              (doc.title && doc.title.toLowerCase().includes(fileSearch))
            )
            .map((doc) => (
              <li key={doc.filename} className="list-item" title={doc.filename}>
                <div className="list-item-title">📄 {doc.filename}</div>
                <div><strong>Description :</strong> {doc.description}</div>
                <div>👤 Uploader : <strong>{doc.uploaded_by || "Inconnu"}</strong></div>

                <div className="button-row">
                  <button className="download-button" onClick={() => handleDownload(doc.filename)}>📥Télécharger</button>

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
            <h3>✏️ Modifier le fichier</h3>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Nouvelle description"
            />
            <div className="modal-buttons">
              <button onClick={handleUpdate} className="edit-button">✅Enregistrer</button>
              <button onClick={() => setEditingFile(null)} className="delete-button">❌Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryDocuments;
