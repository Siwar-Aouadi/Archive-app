import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Doc.css";

function DocumentList() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get("http://localhost:5000/documents");
        setDocuments(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération :", err);
      }
    };

    fetchDocuments();
  }, []);

  const handleDownload = (filename) => {
    window.open(`http://localhost:5000/download/${filename}`, "_blank");
  };

  return (
    <div className="document-container">
      <h2 className="document-title">Liste des fichiers</h2>

      {documents.length === 0 ? (
        <p style={{ textAlign: "center" }}>Aucun fichier disponible pour le moment.</p>
      ) : (
        <ul className="document-list">
          {documents.map((doc, index) => (
            <li className="document-item" key={index}>
              <div className="document-item-title">{doc.title}</div>
              <div className="document-item-description">{doc.description}</div>
              <button
                className="download-button"
                onClick={() => handleDownload(doc.filename)}
              >
                📥 Télécharger
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DocumentList;
