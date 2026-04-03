import React from 'react';
import AdminTable from '../components/AdminTable';

const AdminAccountsPage = () => {
  const columns = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'account_number', label: 'Numéro de Compte', sortable: true },
    { key: 'owner_name', label: 'Propriétaire', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'account_type', label: 'Type', sortable: true },
    {
      key: 'balance',
      label: 'Solde',
      type: 'currency',
      sortable: true
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'badge',
      render: (value) => <span className={`status-badge ${value.toLowerCase()}`}>{value}</span>
    },
    { key: 'agent_name', label: 'Agent' },
    {
      key: 'created_at',
      label: 'Date Création',
      type: 'date',
      sortable: true
    },
  ];

  const filters = [
    {
      name: 'type',
      label: 'Filtrer par type',
      options: [
        { value: 'CURRENT', label: 'Courant' },
        { value: 'SAVING', label: 'Épargne' },
        { value: 'FIXED_DEPOSIT', label: 'Dépôt à terme' },
      ],
    },
    {
      name: 'status',
      label: 'Filtrer par statut',
      options: [
        { value: 'ACTIVE', label: 'Actif' },
        { value: 'FROZEN', label: 'Gelé' },
        { value: 'CLOSED', label: 'Fermé' },
      ],
    },
  ];

  return (
    <div className="admin-page">
      <AdminTable
        title="Gestion des Comptes Bancaires"
        endpoint="/api/bank/admin/accounts"
        columns={columns}
        filters={filters}
        searchPlaceholder="Rechercher par numéro, propriétaire..."
      />
    </div>
  );
};

export default AdminAccountsPage;
