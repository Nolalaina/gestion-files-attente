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
      name: 'role',
      label: 'Filtrer par rôle',
      options: [
        { value: 'admin', label: 'Administrateur' },
        { value: 'agent', label: 'Agent Bancaire' },
        { value: 'usager', label: 'Client' },
      ],
    },
    {
      name: 'status',
      label: 'Filtrer par statut',
      options: [
        { value: 'active', label: 'Actif' },
        { value: 'inactive', label: 'Inactif' },
      ],
    },
  ];

  return (
    <div className="admin-page">
      <AdminTable
        title="Gestion des Utilisateurs"
        endpoint="/admin/users"
        columns={columns}
        filters={filters}
        searchPlaceholder="Rechercher par nom, email..."
      />
    </div>
  );
};

export default AdminUsersPage;
