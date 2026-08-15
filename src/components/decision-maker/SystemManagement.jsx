import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Trash2, UserPlus, Loader2, Shield, Users, Radio } from 'lucide-react';

const SystemManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('manager'); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const usersRes = await api.get(`/user/all_with_no_role`, { headers });
      const rolesRes = await api.get(`/role/roles`, { headers });
      
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId, email, roleName) => {
    try {
      const token = localStorage.getItem('token');
      
      await api.post(`/role/assign_role`, {
        name: roleName,
        user_id: userId,
        email: email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Role assigned successfully");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to assign role");
    }
  };

  const deleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to remove this role from the user?")) return;
    try {
      const token = localStorage.getItem('token');

      await api.delete(`/role/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Role removed successfully");
      fetchData();
    } catch (err) {
      alert("Failed to remove role");
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 h-full overflow-y-auto text-slate-100 font-sans relative" dir="ltr">
      
      {/* Background Neon Grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

      <div className="flex justify-between items-center border-b border-slate-900 pb-4 relative z-10">
        <div>
          <h1 className="text-xl font-extrabold text-slate-200 text-left uppercase tracking-wider">System Control & Management</h1>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Control roles, access permissions, and GeoAI credentials</p>
        </div>
        {loading && <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* PANEL 1: Pending Access Approvals */}
        <section className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl shadow-xl backdrop-blur-sm text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Users className="w-4 h-4 text-emerald-450" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Users Pending Role Assignment</h2>
            </div>
            
            {users.length === 0 ? (
              <p className="text-[10px] text-slate-500 py-8 text-center font-mono">NO PENDING USERS IN QUEUE</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {users.map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-900 rounded-xl">
                    <span className="text-xs font-semibold text-slate-350 font-mono">{user.email}</span>
                    <div className="flex gap-2 items-center">
                      <select 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                      >
                        <option value="manager">Manager</option>
                        <option value="engineer">Engineer</option>
                        <option value="farmer">Farmer</option>
                      </select>
                      <button 
                        onClick={() => assignRole(user.id, user.email, selectedRole)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm shadow-emerald-950/20"
                      >
                        <UserPlus size={12}/> Assign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* PANEL 2: Active User Permissions */}
        <section className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl shadow-xl backdrop-blur-sm text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-emerald-455" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Permissions</h2>
            </div>

            {roles.length === 0 ? (
              <p className="text-[10px] text-slate-500 py-8 text-center font-mono">NO ACTIVE ROLES DEFINED</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {roles.map((role) => (
                  <div key={role.role_id} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-900 rounded-xl">
                    <div className="text-left">
                      <p className="font-bold text-xs text-slate-200">{role.user_name || 'Anonymous User'}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{role.user_email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider font-mono">
                        {role.role}
                      </span>
                      <button 
                        onClick={() => deleteRole(role.role_id)}
                        className="text-red-400 hover:bg-red-950 p-1.5 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default SystemManagement;