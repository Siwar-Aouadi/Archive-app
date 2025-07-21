import React from 'react';
import MyAccessRequests from './MyAccessRequests';
import ReceivedAccessRequests from './ReceivedAccessRequests';

function AccessManagement() {
  const token = localStorage.getItem('token');

  return (
    <div>
      <h2>🔐 Gestion des autorisations</h2>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div>
          <MyAccessRequests token={token} />
        </div>
        <div>
          <ReceivedAccessRequests token={token} />
        </div>
      </div>
    </div>
  );
}

export default AccessManagement;
