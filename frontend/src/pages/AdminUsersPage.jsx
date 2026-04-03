import React from 'react';
import AdminTable from '../components/AdminTable';

const AdminUsersPage = () => {
  const columns = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'first_name', label: 'Prénom', sortable: true },
    { key: 'last_name', label: 'Nom', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Téléphone' },
    { key: 'role_name', label: 'Rôle', sortable: true },
    {
      key: 'status',
      label: 'Statut',
      type: 'badge',
      render: (value) => <span className={`status-badge ${value.toLowerCase()}`}>{value}</span>
    },
    { key: 'account_count', label: 'Comptes' },
    {
      key: 'created_at',
      label: 'Date Inscription',
      type: 'date',
      sortable: true
    },
    {
      key: 'last_login',
      label: 'Dernière Connexion',
      type: 'date',
      render: (value) => value ? new Date(value).toLocaleDateString('fr-FR') : 'Jamais'
    },
  ];

  const filters = [
    {
      name: 'role_id',
      label: 'Filtrer par rôle',
      options: [
        { value: '1', label: 'Administrateur' },
        { value: '2', label: 'Agent Bancaire' },
        { value: '3', label: 'Client' },
      ],
    },
    {
      name: 'status',
      label: 'Filtrer par statut',
      options: [
        { value: 'ACTIVE', label: 'Actif' },
        { value: 'INACTIVE', label: 'Inactif' },
        { value: 'BLOCKED', label: 'Bloqué' },
      ],
    },
  ];

  return (
    <div className="admin-page">
      <AdminTable
        title="Gestion des Utilisateurs"
        endpoint="/api/bank/admin/users"
        columns={columns}
        filters={filters}
        searchPlaceholder="Rechercher par nom, email..."
      />
    </div>
  );
};

export default AdminUsersPage;
