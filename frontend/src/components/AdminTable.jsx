import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import '../styles/AdminTable.css';

const AdminTable = ({ 
  title, 
  endpoint, 
  columns, 
  filters = [],
  searchPlaceholder = 'Rechercher...',
  pageSize = 50 
}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: pageSize, offset: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchData();
  }, [currentPage, activeFilters, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const params = {
        limit: pageSize,
        offset,
        ...(search && { search }),
        ...activeFilters,
      };

      const response = await axios.get(endpoint, { params });
      setData(response.data.data);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Erreur fetch:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (filterName, value) => {
    setCurrentPage(1);
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: value || undefined,
    }));
  };

  const renderCellValue = (row, column) => {
    const value = column.accessor ? column.accessor(row) : row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }

    if (column.type === 'currency') {
      return `$${parseFloat(value).toFixed(2)}`;
    }

    if (column.type === 'date') {
      return new Date(value).toLocaleDateString('fr-FR');
    }

    if (column.type === 'badge') {
      return <span className={`badge ${value}`}>{value}</span>;
    }

    return value;
  };

  return (
    <div className="admin-table-container">
      <div className="table-header">
        <h2>{title}</h2>
        <div className="table-info">
          Total: <strong>{pagination.total}</strong> | 
          Page <strong>{currentPage}</strong> / <strong>{pagination.pages}</strong>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filtres */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>

        {filters.length > 0 && (
          <div className="filter-controls">
            {filters.map(filter => (
              <select
                key={filter.name}
                value={activeFilters[filter.name] || ''}
                onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                className="filter-select"
              >
                <option value="">{filter.label}</option>
                {filter.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : data.length === 0 ? (
          <div className="no-data">Aucune donnée</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={col.sortable ? 'sortable' : ''}
                  >
                    {col.label}
                    {col.sortable && sortConfig.key === col.key && (
                      <span className={`sort-indicator ${sortConfig.direction}`}>
                        {sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.id || idx} className="table-row">
                  {columns.map(col => (
                    <td key={col.key} className={`col-${col.key}`}>
                      {renderCellValue(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ← Précédent
          </button>

          <div className="page-numbers">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? 'active' : ''}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
            disabled={currentPage === pagination.pages}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminTable;
