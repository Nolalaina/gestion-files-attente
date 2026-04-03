import React from 'react';
import AdminTable from '../components/AdminTable';

const AdminLogsPage = () => {
  const columns = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'user_name', label: 'Utilisateur', sortable: true },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'entity_type', label: 'Entité' },
    {
      key: 'status',
      label: 'Statut',
      type: 'badge',
      render: (value) => <span className={`status-badge ${value.toLowerCase()}`}>{value}</span>
    },
    { key: 'description', label: 'Description' },
    { key: 'ip_address', label: 'Adresse IP' },
    {
      key: 'created_at',
      label: 'Date',
      type: 'date',
      sortable: true
    },
    {
      key: 'error_message',
      label: 'Erreur',
      render: (value) => value ? <span className="error-text">{value.substring(0, 50)}...</span> : '-'
    },
  ];

  const filters = [
    {
      name: 'action',
      label: 'Filtrer par action',
      options: [
        { value: 'LOGIN', label: 'Connexion' },
        { value: 'LOGOUT', label: 'Déconnexion' },
        { value: 'CREATE', label: 'Création' },
        { value: 'UPDATE', label: 'Modification' },
        { value: 'DELETE', label: 'Suppression' },
        { value: 'TRANSFER', label: 'Virement' },
      ],
    },
    {
      name: 'status',
      label: 'Filtrer par statut',
      options: [
        { value: 'SUCCESS', label: 'Réussis' },
        { value: 'FAILURE', label: 'Échoués' },
      ],
    },
  ];

  return (
    <div className="admin-page">
      <AdminTable
        title="Logs d'Activité"
        endpoint="/api/bank/admin/logs"
        columns={columns}
        filters={filters}
        searchPlaceholder="Rechercher par utilisateur, action..."
        pageSize={50}
      />
    </div>
  );
};

export default AdminLogsPage;
