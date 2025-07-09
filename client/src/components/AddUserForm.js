import React, { useState } from "react";
import axios from "axios";
import "./AddUser.css";

function AddUserForm() {
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [message, setMessage] = useState("");

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUsername || !newPassword || !newRole) {
      setMessage("❌ Tous les champs sont requis");
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/add_user`, {
        username: newUsername,
        password: newPassword,
        role: newRole,
      });

      setMessage(res.data.message || "✅ Utilisateur ajouté !");
      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.error || "❌ Erreur lors de l'ajout de l'utilisateur"
      );
    }
  };

  return (
    <div className="add-user-container">
      <h2 className="add-user-title">👤 Ajouter un nouvel utilisateur</h2>
      <form className="add-user-form" onSubmit={handleAddUser}>
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
        >
          <option value="user">Utilisateur</option>
          <option value="admin">Administrateur</option>
        </select>
        <button type="submit">Ajouter l'utilisateurr </button>
      </form>
      {message && <p className="add-user-message">{message}</p>}
    </div>
  );
}

export default AddUserForm;
