// src/pages/admin/ManageSalesReps.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_PERMISSIONS, ADMIN_ONLY_PERMISSIONS, groupPermissions } from '../../config/permissions';
import './ManageSalesReps.css';

const ManageSalesReps = () => {
  const { user } = useAuth();
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRep, setCurrentRep] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', permissions: []
  });

  const groupedPerms = groupPermissions();

  const fetchReps = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.get('/users/sales-reps/list', config);
      setSalesReps(data.salesReps);
    } catch (error) {
      console.error('Failed to fetch sales reps', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReps(); }, []);

  const handleCreateChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionToggle = (permKey) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter((p) => p !== permKey)
        : [...prev.permissions, permKey]
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.post('/users/sales-rep', formData, config);
      alert('Sales Representative created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', phone: '', password: '', permissions: [] });
      fetchReps();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create sales rep');
    }
  };

  const openEditModal = (rep) => {
    setCurrentRep(rep);
    setShowEditModal(true);
  };

  const handleEditPermToggle = (permKey) => {
    const currentPerms = currentRep.permissions || [];
    const updatedPerms = currentPerms.includes(permKey)
      ? currentPerms.filter((p) => p !== permKey)
      : [...currentPerms, permKey];
    setCurrentRep({ ...currentRep, permissions: updatedPerms });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.put(`/users/${currentRep._id}/permissions`, { permissions: currentRep.permissions }, config);
      alert('Permissions updated successfully!');
      setShowEditModal(false);
      fetchReps();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update permissions');
    }
  };

  const handleDelete = async (repId, repName) => {
    if (window.confirm(`Are you sure you want to delete ${repName}? This action cannot be undone.`)) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await api.delete(`/users/${repId}`, config);
        alert('Sales Rep deleted successfully.');
        fetchReps();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete sales rep');
      }
    }
  };

  const getPermLabel = (key) => {
    return ADMIN_PERMISSIONS.find(p => p.key === key)?.label || key;
  };

  // ─── RENDER HELPERS ───
  const renderPermTags = (permissions) => {
    if (!permissions || permissions.length === 0) {
      return <span className="perm-tag-empty">No access granted</span>;
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {permissions.map((perm) => (
          <span key={perm} className="perm-tag">{getPermLabel(perm)}</span>
        ))}
      </div>
    );
  };

  return (
    <div className="manage-reps-page">
      {/* ─── HEADER ─── */}
      <div className="manage-reps-header">
        <div>
          <h1>Sales Representatives</h1>
          <p>Manage your sales team and their page access permissions.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-add-rep">
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>+</span> Add Sales Rep
        </button>
      </div>

      {/* ─── LOADING STATE ─── */}
      {loading && (
        <div className="reps-loading">
          <div className="spinner" />
          <p>Loading sales representatives…</p>
        </div>
      )}

      {/* ─── EMPTY STATE ─── */}
      {!loading && salesReps.length === 0 && (
        <div className="reps-empty-state">
          <div className="empty-icon">👤</div>
          <p>No sales representatives found. Create one to get started!</p>
        </div>
      )}

      {/* ─── DESKTOP TABLE (hidden on mobile) ─── */}
      {!loading && salesReps.length > 0 && (
        <div className="reps-table-container">
          <table className="reps-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Permissions</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesReps.map((rep) => (
                <tr key={rep._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{rep.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                      Created: {new Date(rep.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem', color: '#111827' }}>{rep.email}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px' }}>{rep.phone}</div>
                  </td>
                  <td>{renderPermTags(rep.permissions)}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEditModal(rep)} className="action-btn action-btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(rep._id, rep.name)} className="action-btn action-btn-delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MOBILE CARD LIST (hidden on desktop) ─── */}
      {!loading && salesReps.length > 0 && (
        <div className="reps-card-list">
          {salesReps.map((rep) => (
            <div key={rep._id} className="rep-card">
              <div className="rep-card-header">
                <div>
                  <div className="rep-card-name">{rep.name}</div>
                  <div className="rep-card-date">
                    Created: {new Date(rep.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="rep-card-actions">
                  <button onClick={() => openEditModal(rep)} className="action-btn action-btn-edit">Edit</button>
                  <button onClick={() => handleDelete(rep._id, rep.name)} className="action-btn action-btn-delete">Delete</button>
                </div>
              </div>
              <div className="rep-card-contact">
                <span>
                  <svg className="contact-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {rep.email}
                </span>
                <span>
                  <svg className="contact-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.259 1.386a1 1 0 01-.258.944l-.57.57a11.036 11.036 0 005.09 5.09l.57-.57a1 1 0 01.944-.258l1.386.259a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {rep.phone}
                </span>
              </div>
              <div className="rep-card-perms">
                {renderPermTags(rep.permissions)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE MODAL ─── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal-content modal-content-create">
            <div className="modal-header">
              <div>
                <h2>New Sales Representative</h2>
                <p>Fill in their details and assign page access.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-field">
                  <label>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleCreateChange} required placeholder="John Doe" />
                </div>
                <div className="form-field">
                  <label>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleCreateChange} required placeholder="john@company.com" />
                </div>
                <div className="form-field">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleCreateChange} required placeholder="+1 234 567 890" />
                </div>
                <div className="form-field">
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleCreateChange} required placeholder="••••••••" />
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <div className="perm-section-title">Assign Page Access</div>
                <div className="perm-grid">
                  {Object.entries(groupedPerms).map(([group, perms]) => (
                    <div key={group} className="perm-group">
                      <h4>{group}</h4>
                      <div>
                        {perms.map((perm) => {
                          const isDisabled = ADMIN_ONLY_PERMISSIONS.includes(perm.key);
                          return (
                            <label key={perm.key} className={`perm-item ${isDisabled ? 'disabled' : ''}`}>
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm.key)}
                                onChange={() => handlePermissionToggle(perm.key)}
                                disabled={isDisabled}
                              />
                              {perm.label}
                              {isDisabled && <span className="admin-only-badge">Admin Only</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-submit">Create Representative</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT PERMISSIONS MODAL ─── */}
      {showEditModal && currentRep && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-content modal-content-edit">
            <div className="modal-header">
              <div>
                <h2>Edit Permissions</h2>
                <p>Updating access for: <strong>{currentRep.name}</strong></p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(groupedPerms).map(([group, perms]) => (
                  <div key={group}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>{group}</h4>
                    <div className="perm-edit-grid">
                      {perms.map((perm) => {
                        const isDisabled = ADMIN_ONLY_PERMISSIONS.includes(perm.key);
                        const isChecked = currentRep.permissions?.includes(perm.key);
                        return (
                          <label
                            key={perm.key}
                            className={`perm-item-edit ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleEditPermToggle(perm.key)}
                              disabled={isDisabled}
                            />
                            {perm.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSalesReps;