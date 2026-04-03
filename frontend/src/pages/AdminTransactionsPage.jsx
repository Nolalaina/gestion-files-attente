import React, { useState } from 'react';
import AdminTable from '../components/AdminTable';

const AdminTransactionsPage = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const columns = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'reference_number', label: 'Référence', sortable: true },
    {
      key: 'transaction_type',
      label: 'Type',
      render: (value) => <span className={`badge ${value}`}>{value}</span>
    },
    {
      key: 'amount',
      label: 'Montant',
      type: 'currency',
      sortable: true
    },
    { key: 'from_account_number', label: 'Du Compte' },
    { key: 'to_account_number', label: 'Au Compte' },
    {
      key: 'status',
      label: 'Statut',
      type: 'badge',
      render: (value) => <span className={`status-badge ${value.toLowerCase()}`}>{value}</span>
    },
    {
      key: 'created_at',
      label: 'Date',
      type: 'date',
      sortable: true
    },
    { key: 'description', label: 'Description' },
  ];

  const filters = [
    {
      name: 'type',
      label: 'Filtrer par type',
      options: [
        { value: 'DEPOSIT', label: 'Dépôt' },
        { value: 'WITHDRAWAL', label: 'Retrait' },
        { value: 'TRANSFER', label: 'Virement' },
        { value: 'FEE', label: 'Frais' },
        { value: 'INTEREST', label: 'Intérêts' },
      ],
    },
    {
      name: 'status',
      label: 'Filtrer par statut',
      options: [
        { value: 'COMPLETED', label: 'Terminée' },
        { value: 'PENDING', label: 'En attente' },
        { value: 'FAILED', label: 'Échouée' },
        { value: 'CANCELLED', label: 'Annulée' },
      ],
    },
  ];

  return (
    <div className="admin-page">
      <div className="date-filters">
        <label>
          Du :
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>
        <label>
          Au :
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
      </div>

      <AdminTable
        title="Historique des Transactions"
        endpoint="/api/bank/admin/transactions"
        columns={columns}
        filters={filters}
        searchPlaceholder="Rechercher par référence, compte..."
        pageSize={50}
      />
    </div>
  );
};

export default AdminTransactionsPage;
