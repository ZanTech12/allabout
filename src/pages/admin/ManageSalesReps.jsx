// src/pages/admin/ManageSalesReps.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios'; // Adjust path to your axios instance
import { useAuth } from '../../context/AuthContext';
import { ADMIN_PERMISSIONS, ADMIN_ONLY_PERMISSIONS, groupPermissions } from '../../../src/config/permissions';
import './ManageSalesReps.css'

const ManageSalesReps = () => {
  const { user } = useAuth();
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRep, setCurrentRep] = useState(null);
  
  // Form states
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

  useEffect(() => {
    fetchReps();
  }, []);

  // ─── CREATE HANDLER ───
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

  // ─── EDIT HANDLER ───
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

  // ─── DELETE HANDLER ───
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Representatives</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your sales team and their page access permissions.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Add Sales Rep
        </button>
      </div>

      {/* ─── TABLE ─── */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">Loading...</td>
              </tr>
            ) : salesReps.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">No sales representatives found. Create one to get started!</td>
              </tr>
            ) : (
              salesReps.map((rep) => (
                <tr key={rep._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{rep.name}</div>
                    <div className="text-sm text-gray-500">Created: {new Date(rep.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rep.email}</div>
                    <div className="text-sm text-gray-500">{rep.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(rep.permissions || []).map((perm) => (
                        <span key={perm} className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium">
                          {ADMIN_PERMISSIONS.find(p => p.key === perm)?.label || perm}
                        </span>
                      ))}
                      {rep.permissions.length === 0 && <span className="text-xs text-gray-400 italic">No access granted</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => openEditModal(rep)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium text-sm mr-4"
                    >
                      Edit Permissions
                    </button>
                    <button 
                      onClick={() => handleDelete(rep._id, rep.name)}
                      className="text-red-600 hover:text-red-900 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── CREATE MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">New Sales Representative</h2>
              <p className="text-sm text-gray-500 mt-1">Fill in their details and assign page access.</p>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleCreateChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleCreateChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleCreateChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleCreateChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-3">Assign Page Access</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedPerms).map(([group, perms]) => (
                    <div key={group}>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">{group}</h4>
                      <div className="space-y-2">
                        {perms.map((perm) => {
                          const isDisabled = ADMIN_ONLY_PERMISSIONS.includes(perm.key);
                          return (
                            <label key={perm.key} className={`flex items-center gap-2 text-sm ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm.key)}
                                onChange={() => handlePermissionToggle(perm.key)}
                                disabled={isDisabled}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              {perm.label}
                              {isDisabled && <span className="text-[10px] text-red-400 font-medium ml-auto">ADMIN ONLY</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">Create Representative</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT PERMISSIONS MODAL ─── */}
      {showEditModal && currentRep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Edit Permissions</h2>
              <p className="text-sm text-gray-500 mt-1">Updating access for: <span className="font-semibold text-gray-900">{currentRep.name}</span></p>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                {Object.entries(groupedPerms).map(([group, perms]) => (
                  <div key={group}>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">{group}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => {
                        const isDisabled = ADMIN_ONLY_PERMISSIONS.includes(perm.key);
                        const isChecked = currentRep.permissions?.includes(perm.key); // ✅ FIXED TYPO
                        return (
                          <label 
                            key={perm.key} 
                            className={`flex items-center gap-2 text-sm p-2 rounded border ${
                              isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleEditPermToggle(perm.key)}
                              disabled={isDisabled}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            {perm.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSalesReps;