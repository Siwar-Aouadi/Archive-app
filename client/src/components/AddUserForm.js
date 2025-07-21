import React, { useState } from "react";
import axios from "axios";
import "./AddUser.css";

function AddUserForm() {
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newService, setNewService] = useState(""); // 👈 service sélectionné
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
        service: newService, // 👈 envoyer le service si applicable
      });

      setMessage(res.data.message || "✅ Utilisateur ajouté !");
      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
      setNewService("");
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
          <option value="responsable_service">Responsable de service</option>
          <option value="admin">Administrateur</option>
        </select>

        {/* Service selection only if not admin */}
        {newRole !== "admin" && (
          <select
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            required
          >
            <option value="">-- Choisir un service --</option>
            <option value="Service 1">Service 1</option>
            <option value="Service 2">Service 2</option>
            <option value="Service 3">Service 3</option>
          </select>
        )}

        <button type="submit">Ajouter l'utilisateur</button>
      </form>
      {message && <p className="add-user-message">{message}</p>}
    </div>
  );
}

export default AddUserForm;
