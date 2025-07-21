import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './access.css';  // importer le fichier CSS

const API_BASE_URL = process.env.REACT_APP_API_URL;

function RequestAccessForm({ token }) {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');

  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/services`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServices(res.data);
      } catch (error) {
        console.error("Erreur lors du chargement des services:", error);
      }
    };
    fetchServices();
  }, [token]);

  useEffect(() => {
    if (!selectedService) {
      setUsers([]);
      setSelectedUser('');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/by-service/${selectedService}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      }
    };
    fetchUsers();
  }, [selectedService, token]);

  useEffect(() => {
    if (!selectedUser) {
      setFiles([]);
      setSelectedFile('');
      return;
    }

    const fetchFiles = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/files/by-user/${selectedUser}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFiles(res.data);
      } catch (error) {
        console.error("Erreur lors du chargement des fichiers:", error);
      }
    };
    fetchFiles();
  }, [selectedUser, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedService || !selectedUser || !selectedFile || !reason) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const file = files.find(f => (f.id || f._id) === selectedFile);
    const fileTitle = file ? (file.title || file.filename || file.nom || '') : '';

    try {
      await axios.post(`${API_BASE_URL}/api/access/request-access`, {
        file_id: selectedFile,
        owner_id: selectedUser,
        title: fileTitle
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Demande envoyée avec succès !");
      setSelectedService('');
      setSelectedUser('');
      setSelectedFile('');
      setReason('');
      setUsers([]);
      setFiles([]);

    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("❌ Erreur lors de l'envoi de la demande.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="access-card access-form">
      <h3>📄 Demande d'accès à un fichier</h3>

      <label htmlFor="service">Service concerné</label>
      <select
        id="service"
        value={selectedService}
        onChange={e => setSelectedService(e.target.value)}
        required
      >
        <option value="">-- Choisir un service --</option>
        {services.map(svc => (
          <option key={svc.id || svc._id || svc} value={svc.id || svc._id || svc}>
            {svc.name || svc.nom || svc}
          </option>
        ))}
      </select>

      {users.length > 0 && (
        <>
          <label htmlFor="user">Utilisateur propriétaire</label>
          <select
            id="user"
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            required
          >
            <option value="">-- Choisir un utilisateur --</option>
            {users.map(user => (
              <option key={user.id || user._id || user.username} value={user.id || user._id || user.username}>
                {user.username || user.nom || user.email || user}
              </option>
            ))}
          </select>
        </>
      )}

      {files.length > 0 && (
        <>
          <label htmlFor="file">Fichier demandé</label>
          <select
            id="file"
            value={selectedFile}
            onChange={e => setSelectedFile(e.target.value)}
            required
          >
            <option value="">-- Choisir un fichier --</option>
            {files.map(file => (
              <option key={file.id || file._id} value={file.id || file._id}>
                {file.filename || file.title || file.nom}
              </option>
            ))}
          </select>
        </>
      )}

      <label htmlFor="reason">Raison de la demande</label>
      <textarea
        id="reason"
        placeholder="Expliquez pourquoi vous demandez l'accès à ce fichier"
        value={reason}
        onChange={e => setReason(e.target.value)}
        rows={3}
        required
      />

      <button type="submit">
        📤 Envoyer la demande
      </button>
    </form>
  );
}

export default RequestAccessForm;
