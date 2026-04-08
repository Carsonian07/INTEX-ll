import { useEffect, useState, useCallback } from 'react';
import { api, AdminUser } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const VALID_ROLES = ['Admin', 'Staff', 'Donor'] as const;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.admin.users.list();
      setUsers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (userId: string) => {
    setSaving(userId);
    setError(null);
    try {
      await api.admin.users.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete user');
    } finally {
      setSaving(null);
      setDeleteId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSaving(userId);
    setError(null);
    try {
      await api.admin.users.setRole(userId, newRole);
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, roles: [newRole] } : u)
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update role');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">User accounts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage roles for all registered accounts.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">MFA</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map(u => {
                const currentRole = u.roles[0] ?? 'Donor';
                const isSelf      = u.id === currentUser?.id;
                const isBusy      = saving === u.id;

                return (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {u.displayName}
                      {isSelf && <span className="ml-2 text-[10px] text-hh-ocean font-semibold uppercase">you</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {u.twoFactorEnabled ? 'On' : 'Off'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-hh-navy-light text-hh-navy dark:bg-hh-ocean/20 dark:text-hh-ocean">
                          {currentRole}
                        </span>
                      ) : (
                        <select
                          value={currentRole}
                          disabled={isBusy}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean disabled:opacity-50"
                        >
                          {VALID_ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      )}
                      {isBusy && <span className="ml-2 text-xs text-gray-400">Saving…</span>}
                    </td>
                    <td className="px-4 py-3">
                      {!isSelf && (
                        deleteId === u.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button onClick={() => handleDelete(u.id)} disabled={isBusy} className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50">Yes</button>
                            <button onClick={() => setDeleteId(null)} className="text-xs text-gray-400 hover:text-gray-600">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteId(u.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
