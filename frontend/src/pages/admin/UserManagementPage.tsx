import React, { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, KeyRound, X, Users as UsersIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast } from '../../contexts';
import { adminService } from '../../services';
import { useDialog } from '../../hooks/useDialog';
import { localeFromLng } from '../../i18n';
import type { AdminUser, AdminUserPayload, UserRole, School } from '../../types';
import './admin.css';

const ROLE_FILTERS: { labelKey: string; value: UserRole | 'all' }[] = [
    { labelKey: 'all', value: 'all' },
    { labelKey: 'admins', value: 'superuser' },
    { labelKey: 'teachers', value: 'teacher' },
    { labelKey: 'students', value: 'student' },
    { labelKey: 'guests', value: 'guest' },
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
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // create / edit modal
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<AdminUser | null>(null);
    const [form, setForm] = useState<AdminUserPayload>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // reset-password modal
    const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const formDialogRef = useDialog(showForm, () => setShowForm(false));
    const resetDialogRef = useDialog(!!resetTarget, () => setResetTarget(null));

    const loadUsers = async (pageNum: number, append: boolean) => {
        try {
            if (append) setLoadingMore(true); else setLoading(true);
            const data = await adminService.getUsers({
                role: roleFilter === 'all' ? undefined : roleFilter,
                search: search.trim() || undefined,
                page: pageNum,
            });
            setUsers((prev) => (append ? [...prev, ...data.results] : data.results));
            setHasMore(Boolean(data.next));
            setTotalCount(data.count);
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            if (append) setLoadingMore(false); else setLoading(false);
        }
    };

    // Reload from page 1 when the role filter changes; debounce search separately.
    useEffect(() => {
        loadUsers(1, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter]);

    useEffect(() => {
        const timer = setTimeout(() => loadUsers(1, false), 300);
        return () => clearTimeout(timer);
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
        if (!data) return t('admin.common.somethingWrong');
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
            loadUsers(1, false);
        } catch (err) {
            setFormError(extractError(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (u: AdminUser) => {
        if (!window.confirm(t('admin.users.deleteConfirm', { username: u.username }))) return;
        try {
            await adminService.deleteUser(u.id);
            loadUsers(1, false);
        } catch (err) {
            toast.error(extractError(err));
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetTarget) return;
        try {
            await adminService.resetPassword(resetTarget.id, newPassword);
            setResetTarget(null);
            setNewPassword('');
            toast.success(t('admin.users.resetSuccess'));
        } catch (err) {
            toast.error(extractError(err));
        }
    };

    const initials = (u: AdminUser) => {
        if (u.first_name && u.last_name) return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
        return u.username.slice(0, 2).toUpperCase();
    };

    const formatDate = (s: string | null) =>
        s ? new Date(s).toLocaleDateString(localeFromLng(i18n.language), { month: 'short', day: 'numeric', year: 'numeric' }) : '—';


    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1 className="admin-header-title">{t('admin.users.title')}</h1>
                    <p className="admin-header-subtitle">{t('admin.users.count', { count: totalCount })}</p>
                </div>
                <div className="admin-toolbar">
                    <div className="admin-search">
                        <span className="admin-search-icon"><Search size={18} strokeWidth={1.85} /></span>
                        <input
                            type="text"
                            placeholder={t('admin.users.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={openCreate}>
                        <Plus size={16} strokeWidth={2} /> {t('admin.users.newUser')}
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
                        {t(`admin.users.filters.${f.labelKey}`)}
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
                        <p>{search ? t('admin.users.noMatch') : t('admin.users.none')}</p>
                    </div>
                </div>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{t('admin.users.colUser')}</th>
                                <th>{t('admin.users.colEmail')}</th>
                                <th>{t('admin.users.colRole')}</th>
                                <th>{t('admin.users.colStatus')}</th>
                                <th>{t('admin.users.colJoined')}</th>
                                <th style={{ textAlign: 'right' }}>{t('admin.users.colActions')}</th>
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
                                    <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{t(`roles.${u.role}`)}</span></td>
                                    <td>
                                        <span className={`admin-pill ${u.is_active ? 'on' : 'off'}`}>
                                            {u.is_active ? t('admin.users.active') : t('admin.users.inactive')}
                                        </span>
                                    </td>
                                    <td className="admin-cell-sub">{formatDate(u.date_joined)}</td>
                                    <td>
                                        <div className="admin-row-actions">
                                            <button className="admin-icon-btn" title={t('admin.users.titleEdit')} onClick={() => openEdit(u)}>
                                                <Pencil size={16} strokeWidth={1.85} />
                                            </button>
                                            <button className="admin-icon-btn" title={t('admin.users.titleReset')} onClick={() => setResetTarget(u)}>
                                                <KeyRound size={16} strokeWidth={1.85} />
                                            </button>
                                            <button
                                                className="admin-icon-btn danger"
                                                title={t('admin.users.titleDelete')}
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

            {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
                    <button className="btn btn-secondary" onClick={() => loadUsers(page + 1, true)} disabled={loadingMore}>
                        {loadingMore ? t('common.loading') : t('common.loadMore')}
                    </button>
                </div>
            )}

            {/* Create / Edit modal */}
            {showForm && (
                <>
                    <div className="modal-backdrop" onClick={() => setShowForm(false)} />
                    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="user-form-title" ref={formDialogRef}>
                        <div className="modal-header">
                            <h2 id="user-form-title">{editing ? t('admin.users.editTitle') : t('admin.users.createTitle')}</h2>
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
                                        <label className="input-label">{t('admin.users.username')}</label>
                                        <input
                                            className="input"
                                            required
                                            disabled={!!editing}
                                            value={form.username}
                                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                                            placeholder={t('admin.users.usernamePlaceholder')}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('admin.users.firstName')}</label>
                                        <input
                                            className="input"
                                            value={form.first_name}
                                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('admin.users.lastName')}</label>
                                        <input
                                            className="input"
                                            value={form.last_name}
                                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group full">
                                        <label className="input-label">{t('admin.users.email')}</label>
                                        <input
                                            className="input"
                                            type="email"
                                            value={form.email || ''}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('admin.users.role')}</label>
                                        <select
                                            className="input"
                                            value={form.role}
                                            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                                        >
                                            <option value="student">{t('roles.student')}</option>
                                            <option value="teacher">{t('roles.teacher')}</option>
                                            <option value="superuser">{t('roles.superuser')}</option>
                                            <option value="guest">{t('roles.guest')}</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('admin.users.status')}</label>
                                        <select
                                            className="input"
                                            value={form.is_active ? 'true' : 'false'}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                                        >
                                            <option value="true">{t('admin.users.active')}</option>
                                            <option value="false">{t('admin.users.inactive')}</option>
                                        </select>
                                    </div>
                                    <div className="input-group full">
                                        <label className="input-label">{t('admin.users.school')} <span className="admin-cell-sub">{t('admin.common.optional')}</span></label>
                                        <select
                                            className="input"
                                            value={form.school ?? ''}
                                            onChange={(e) => setForm({ ...form, school: e.target.value ? Number(e.target.value) : null })}
                                        >
                                            <option value="">{t('admin.users.noSchoolOption')}</option>
                                            {schools.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}{s.region_name ? ` · ${s.region_name}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group full">
                                        <label className="input-label">
                                            {editing ? t('admin.users.passwordNew') : t('admin.users.password')}
                                        </label>
                                        <input
                                            className="input"
                                            type="password"
                                            required={!editing}
                                            minLength={6}
                                            value={form.password || ''}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            placeholder={t('admin.users.passwordPlaceholder')}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>{t('admin.common.cancel')}</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? t('admin.common.saving') : editing ? t('admin.common.saveChanges') : t('admin.users.createBtn')}
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
                    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="user-reset-title" ref={resetDialogRef} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h2 id="user-reset-title">{t('admin.users.resetTitle')}</h2>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setResetTarget(null)}>
                                <X size={18} strokeWidth={1.85} />
                            </button>
                        </div>
                        <form onSubmit={handleReset}>
                            <div className="modal-body">
                                <p className="admin-cell-sub" style={{ marginBottom: 'var(--space-4)' }}>
                                    {t('admin.users.resetDesc', { username: `@${resetTarget.username}` })}
                                </p>
                                <div className="input-group">
                                    <label className="input-label">{t('admin.users.resetNewPassword')}</label>
                                    <input
                                        className="input"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder={t('admin.users.passwordPlaceholder')}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setResetTarget(null)}>{t('admin.common.cancel')}</button>
                                <button type="submit" className="btn btn-primary">{t('admin.users.resetBtn')}</button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserManagementPage;
