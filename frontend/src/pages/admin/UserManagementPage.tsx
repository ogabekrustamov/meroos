import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, KeyRound, X, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../../contexts';
import { adminService } from '../../services';
import type { AdminUser, AdminUserPayload, UserRole, School } from '../../types';
import './admin.css';

const ROLE_FILTERS: { label: string; value: UserRole | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Admins', value: 'superuser' },
    { label: 'Teachers', value: 'teacher' },
    { label: 'Students', value: 'student' },
    { label: 'Guests', value: 'guest' },
];

const ROLE_BADGE: Record<UserRole, string> = {
    superuser: 'badge-error',
    teacher: 'badge-primary',
    student: 'badge-secondary',
    guest: 'badge-warning',
};

const emptyForm: AdminUserPayload = {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'student',
    is_active: true,
    password: '',
    school: null,
};

const UserManagementPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [search, setSearch] = useState('');

    // create / edit modal
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<AdminUser | null>(null);
    const [form, setForm] = useState<AdminUserPayload>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // reset-password modal
    const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers({
                role: roleFilter === 'all' ? undefined : roleFilter,
                search: search.trim() || undefined,
            });
            setUsers(data);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    // Reload when the role filter changes; debounce search separately.
    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter]);

    useEffect(() => {
        const t = setTimeout(loadUsers, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // Schools are needed for the create/edit form's school assignment.
    useEffect(() => {
        adminService.getSchools()
            .then(setSchools)
            .catch((err) => console.error('Failed to load schools:', err));
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormError(null);
        setShowForm(true);
    };

    const openEdit = (u: AdminUser) => {
        setEditing(u);
        setForm({
            username: u.username,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email || '',
            role: u.role,
            is_active: u.is_active,
            password: '',
            school: u.school,
        });
        setFormError(null);
        setShowForm(true);
    };

    const extractError = (err: any): string => {
        const data = err?.response?.data;
        if (!data) return 'Something went wrong. Please try again.';
        if (typeof data === 'string') return data;
        if (data.detail) return Array.isArray(data.detail) ? data.detail.join(' ') : data.detail;
        const first = Object.values(data)[0];
        return Array.isArray(first) ? String(first[0]) : String(first);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError(null);
        try {
            const payload: AdminUserPayload = { ...form };
            if (editing && !payload.password) delete payload.password;
            if (editing) {
                // username is immutable on the server-friendly path; don't resend it
                delete payload.username;
                await adminService.updateUser(editing.id, payload);
            } else {
                await adminService.createUser(payload);
            }
            setShowForm(false);
            loadUsers();
        } catch (err) {
            setFormError(extractError(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (u: AdminUser) => {
        if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
        try {
            await adminService.deleteUser(u.id);
            loadUsers();
        } catch (err) {
            alert(extractError(err));
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetTarget) return;
        try {
            await adminService.resetPassword(resetTarget.id, newPassword);
            setResetTarget(null);
            setNewPassword('');
            alert('Password reset successfully.');
        } catch (err) {
            alert(extractError(err));
        }
    };

    const initials = (u: AdminUser) => {
        if (u.first_name && u.last_name) return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
        return u.username.slice(0, 2).toUpperCase();
    };

    const formatDate = (s: string | null) =>
        s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const counts = useMemo(() => users.length, [users]);

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1 className="admin-header-title">User Management</h1>
                    <p className="admin-header-subtitle">{counts} user{counts === 1 ? '' : 's'}</p>
                </div>
                <div className="admin-toolbar">
                    <div className="admin-search">
                        <span className="admin-search-icon"><Search size={18} strokeWidth={1.85} /></span>
                        <input
                            type="text"
                            placeholder="Search by name, username, email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={openCreate}>
                        <Plus size={16} strokeWidth={2} /> New User
                    </button>
                </div>
            </div>

            <div className="admin-filters">
                {ROLE_FILTERS.map((f) => (
                    <button
                        key={f.value}
                        className={`admin-filter ${roleFilter === f.value ? 'active' : ''}`}
                        onClick={() => setRoleFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-overlay" style={{ position: 'static', minHeight: 240 }}>
                    <div className="spinner spinner-lg" />
                </div>
            ) : users.length === 0 ? (
                <div className="admin-table-wrap">
                    <div className="admin-empty">
                        <div className="admin-empty-icon"><UsersIcon size={48} strokeWidth={1.6} /></div>
                        <p>{search ? 'No users match your search.' : 'No users found.'}</p>
                    </div>
                </div>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="admin-cell-user">
                                            <div className="avatar avatar-sm">{initials(u)}</div>
                                            <div>
                                                <div className="admin-cell-name">{u.full_name || u.username}</div>
                                                <div className="admin-cell-sub">@{u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{u.email || <span className="admin-cell-sub">—</span>}</td>
                                    <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                                    <td>
                                        <span className={`admin-pill ${u.is_active ? 'on' : 'off'}`}>
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="admin-cell-sub">{formatDate(u.date_joined)}</td>
                                    <td>
                                        <div className="admin-row-actions">
                                            <button className="admin-icon-btn" title="Edit" onClick={() => openEdit(u)}>
                                                <Pencil size={16} strokeWidth={1.85} />
                                            </button>
                                            <button className="admin-icon-btn" title="Reset password" onClick={() => setResetTarget(u)}>
                                                <KeyRound size={16} strokeWidth={1.85} />
                                            </button>
                                            <button
                                                className="admin-icon-btn danger"
                                                title="Delete"
                                                disabled={u.id === currentUser?.id}
                                                style={u.id === currentUser?.id ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                                                onClick={() => u.id !== currentUser?.id && handleDelete(u)}
                                            >
                                                <Trash2 size={16} strokeWidth={1.85} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create / Edit modal */}
            {showForm && (
                <>
                    <div className="modal-backdrop" onClick={() => setShowForm(false)} />
                    <div className="modal" role="dialog">
                        <div className="modal-header">
                            <h2>{editing ? 'Edit User' : 'Create User'}</h2>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowForm(false)}>
                                <X size={18} strokeWidth={1.85} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {formError && (
                                    <div className="badge badge-error" style={{ display: 'block', marginBottom: 'var(--space-4)', padding: 'var(--space-2) var(--space-3)' }}>
                                        {formError}
                                    </div>
                                )}
                                <div className="admin-form-grid">
                                    <div className="input-group full">
                                        <label className="input-label">Username</label>
                                        <input
                                            className="input"
                                            required
                                            disabled={!!editing}
                                            value={form.username}
                                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                                            placeholder="username"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">First name</label>
                                        <input
                                            className="input"
                                            value={form.first_name}
                                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Last name</label>
                                        <input
                                            className="input"
                                            value={form.last_name}
                                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group full">
                                        <label className="input-label">Email</label>
                                        <input
                                            className="input"
                                            type="email"
                                            value={form.email || ''}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Role</label>
                                        <select
                                            className="input"
                                            value={form.role}
                                            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                                        >
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="superuser">Admin</option>
                                            <option value="guest">Guest</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Status</label>
                                        <select
                                            className="input"
                                            value={form.is_active ? 'true' : 'false'}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="input-group full">
                                        <label className="input-label">School <span className="admin-cell-sub">(optional)</span></label>
                                        <select
                                            className="input"
                                            value={form.school ?? ''}
                                            onChange={(e) => setForm({ ...form, school: e.target.value ? Number(e.target.value) : null })}
                                        >
                                            <option value="">— No school —</option>
                                            {schools.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}{s.region_name ? ` · ${s.region_name}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group full">
                                        <label className="input-label">
                                            {editing ? 'New password (leave blank to keep current)' : 'Password'}
                                        </label>
                                        <input
                                            className="input"
                                            type="password"
                                            required={!editing}
                                            minLength={6}
                                            value={form.password || ''}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            placeholder="Minimum 6 characters"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Reset password modal */}
            {resetTarget && (
                <>
                    <div className="modal-backdrop" onClick={() => setResetTarget(null)} />
                    <div className="modal" role="dialog" style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h2>Reset Password</h2>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setResetTarget(null)}>
                                <X size={18} strokeWidth={1.85} />
                            </button>
                        </div>
                        <form onSubmit={handleReset}>
                            <div className="modal-body">
                                <p className="admin-cell-sub" style={{ marginBottom: 'var(--space-4)' }}>
                                    Set a new password for <strong>@{resetTarget.username}</strong>.
                                </p>
                                <div className="input-group">
                                    <label className="input-label">New password</label>
                                    <input
                                        className="input"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setResetTarget(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Reset password</button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserManagementPage;
