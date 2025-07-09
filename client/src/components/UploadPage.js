import React, { useState } from "react";
import axios from "axios";
import "./UploadPage.css";

function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!file || !title || !description) {
      setMessage("❌ Veuillez remplir tous les champs");
      return;
    }
  
    const username = localStorage.getItem("username");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("file", file);
    formData.append("username", username); // 👈 ajout du username
  
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      setMessage(`✅ Document "${res.data.filename}" uploadé avec succès`);
      setTitle("");
      setDescription("");
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de l'envoi du fichier");
    }
  };
  

  return (
    <div className="upload-container">
      <h2 className="upload-title">Télécharger un fichier </h2>

      <form onSubmit={handleSubmit} className="upload-form">
        <input
          type="text"
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        ></textarea>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />

        <button type="submit">Télécharger le fichier</button>
      </form>

      {message && <p className="upload-message">{message}</p>}
    </div>
  );
}

export default UploadPage;
