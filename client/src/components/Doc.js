import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Doc.css";

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/documents`);
        setDocuments(res.data);
      } catch (err) {
        console.error("Erreur de chargement :", err);
      }
    };

    fetchDocuments();
  }, []);

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
    setNewTitle(doc.title);
    setNewDescription(doc.description);
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
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/update/${editingFile.filename}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message);
      setEditingFile(null);
      const refreshed = await axios.get(`${process.env.REACT_APP_API_URL}/documents`);
      setDocuments(refreshed.data);
    } catch (err) {
      alert("❌ Erreur de mise à jour : " + (err.response?.data?.error || "Erreur inconnue"));
    }
  };

  return (
    <div className="document-container">
      <h2 className="document-title">Liste des fichiers</h2>

      {documents.length === 0 ? (
        <p className="no-doc">Aucun fichier disponible.</p>
      ) : (
        <ul className="document-list">
          {documents.map((doc, index) => (
            <li key={index} className="document-item">
              <div className="document-item-title">{doc.title}</div>
              <div className="document-item-description">{doc.description}</div>
              <div className="document-meta">
                👤 Uploader : <strong>{doc.uploaded_by || "Inconnu"}</strong>
              </div>

              <button
                className="download-button"
                onClick={() => handleDownload(doc.filename)}
              >
                📥 Télécharger
              </button>

              {(role === "admin" || doc.uploaded_by?.toLowerCase() === username?.toLowerCase()) && (
                <>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(doc.filename)}
                  >
                    🗑️ Supprimer
                  </button>
                  <button
                    className="edit-button"
                    onClick={() => openEditModal(doc)}
                  >
                    ✏️ Modifier
                  </button>
                </>
              )}
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
              onChange={(e) => setNewFile(e.target.files[0])}
            />
            <div className="modal-buttons">
              <button onClick={handleUpdate} className="edit-button">
                ✅ Enregistrer
              </button>
              <button
                onClick={() => setEditingFile(null)}
                className="delete-button"
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentList;
