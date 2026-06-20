import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, MapPin, School as SchoolIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../services';
import { useToast } from '../../contexts';
import type { Region, School } from '../../types';
import './admin.css';

type Tab = 'regions' | 'schools';

const OrganizationManagementPage: React.FC = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const [tab, setTab] = useState<Tab>('regions');
    const [regions, setRegions] = useState<Region[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);

    // modal state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [r, s] = await Promise.all([adminService.getRegions(), adminService.getSchools()]);
            setRegions(r);
            setSchools(s);
        } catch (err) {
            console.error('Failed to load organizations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const extractError = (err: any): string => {
        const data = err?.response?.data;
        if (!data) return t('admin.common.somethingWrong');
        if (typeof data === 'string') return data;
        if (data.detail) return Array.isArray(data.detail) ? data.detail.join(' ') : data.detail;
        const first = Object.values(data)[0];
        return Array.isArray(first) ? String(first[0]) : String(first);
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(tab === 'regions'
            ? { name: '', code: '', description: '' }
            : { name: '', school_number: '', region: regions[0]?.id ?? '', address: '', phone_number: '', email: '', principal_name: '' });
        setFormError(null);
        setShowForm(true);
    };

    const openEditRegion = (r: Region) => {
        setEditingId(r.id);
        setForm({ name: r.name, code: r.code || '', description: r.description || '' });
        setFormError(null);
        setShowForm(true);
    };

    const openEditSchool = (s: School) => {
        setEditingId(s.id);
        setForm({
            name: s.name,
            school_number: s.school_number || '',
            region: s.region,
            address: s.address || '',
            phone_number: s.phone_number || '',
            email: s.email || '',
            principal_name: s.principal_name || '',
        });
        setFormError(null);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError(null);
        try {
            if (tab === 'regions') {
                if (editingId) await adminService.updateRegion(editingId, form);
                else await adminService.createRegion(form);
            } else {
                const payload = { ...form, region: Number(form.region) };
                if (editingId) await adminService.updateSchool(editingId, payload);
                else await adminService.createSchool(payload);
            }
            setShowForm(false);
            loadAll();
        } catch (err) {
            setFormError(extractError(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRegion = async (r: Region) => {
        if (!window.confirm(t('admin.orgs.deleteRegionConfirm', { name: r.name }))) return;
        try {
            await adminService.deleteRegion(r.id);
            loadAll();
        } catch (err) {
            toast.error(extractError(err));
        }
    };

    const handleDeleteSchool = async (s: School) => {
        if (!window.confirm(t('admin.orgs.deleteSchoolConfirm', { name: s.name }))) return;
        try {
            await adminService.deleteSchool(s.id);
            loadAll();
        } catch (err) {
            toast.error(extractError(err));
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1 className="admin-header-title">{t('admin.orgs.title')}</h1>
                    <p className="admin-header-subtitle">{t('admin.orgs.subtitle', { regions: regions.length, schools: schools.length })}</p>
                </div>
                <div className="admin-toolbar">
                    <button className="btn btn-primary" onClick={openCreate} disabled={tab === 'schools' && regions.length === 0}>
                        <Plus size={16} strokeWidth={2} /> {tab === 'regions' ? t('admin.orgs.newRegion') : t('admin.orgs.newSchool')}
                    </button>
                </div>
            </div>

            <div className="admin-filters">
                <button className={`admin-filter ${tab === 'regions' ? 'active' : ''}`} onClick={() => setTab('regions')}>{t('admin.orgs.tabRegions')}</button>
                <button className={`admin-filter ${tab === 'schools' ? 'active' : ''}`} onClick={() => setTab('schools')}>{t('admin.orgs.tabSchools')}</button>
            </div>

            {tab === 'schools' && regions.length === 0 && !loading && (
                <p className="admin-cell-sub" style={{ marginBottom: 'var(--space-4)' }}>
                    {t('admin.orgs.regionFirst')}
                </p>
            )}

            {loading ? (
                <div className="loading-overlay" style={{ position: 'static', minHeight: 240 }}>
                    <div className="spinner spinner-lg" />
                </div>
            ) : tab === 'regions' ? (
                <div className="admin-table-wrap">
                    {regions.length === 0 ? (
                        <div className="admin-empty">
                            <div className="admin-empty-icon"><MapPin size={48} strokeWidth={1.6} /></div>
                            <p>{t('admin.orgs.noRegions')}</p>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{t('admin.orgs.colRegion')}</th>
                                    <th>{t('admin.orgs.colCode')}</th>
                                    <th>{t('admin.orgs.colSchools')}</th>
                                    <th>{t('admin.orgs.colStudents')}</th>
                                    <th style={{ textAlign: 'right' }}>{t('admin.orgs.colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regions.map((r) => (
                                    <tr key={r.id}>
                                        <td className="admin-cell-name">{r.name}</td>
                                        <td>{r.code || <span className="admin-cell-sub">—</span>}</td>
                                        <td>{r.total_schools ?? 0}</td>
                                        <td>{r.total_students ?? 0}</td>
                                        <td>
                                            <div className="admin-row-actions">
                                                <button className="admin-icon-btn" title={t('admin.common.edit')} onClick={() => openEditRegion(r)}>
                                                    <Pencil size={16} strokeWidth={1.85} />
                                                </button>
                                                <button className="admin-icon-btn danger" title={t('admin.common.delete')} onClick={() => handleDeleteRegion(r)}>
                                                    <Trash2 size={16} strokeWidth={1.85} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div className="admin-table-wrap">
                    {schools.length === 0 ? (
                        <div className="admin-empty">
                            <div className="admin-empty-icon"><SchoolIcon size={48} strokeWidth={1.6} /></div>
                            <p>{t('admin.orgs.noSchools')}</p>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{t('admin.orgs.colSchool')}</th>
                                    <th>{t('admin.orgs.colRegion')}</th>
                                    <th>{t('admin.orgs.colClasses')}</th>
                                    <th>{t('admin.orgs.colStudents')}</th>
                                    <th>{t('admin.orgs.colTeachers')}</th>
                                    <th style={{ textAlign: 'right' }}>{t('admin.orgs.colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schools.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <div className="admin-cell-name">{s.name}</div>
                                            {s.school_number && <div className="admin-cell-sub">{t('admin.orgs.schoolNo', { n: s.school_number })}</div>}
                                        </td>
                                        <td>{s.region_name || <span className="admin-cell-sub">—</span>}</td>
                                        <td>{s.total_classes ?? 0}</td>
                                        <td>{s.total_students ?? 0}</td>
                                        <td>{s.total_teachers ?? 0}</td>
                                        <td>
                                            <div className="admin-row-actions">
                                                <button className="admin-icon-btn" title={t('admin.common.edit')} onClick={() => openEditSchool(s)}>
                                                    <Pencil size={16} strokeWidth={1.85} />
                                                </button>
                                                <button className="admin-icon-btn danger" title={t('admin.common.delete')} onClick={() => handleDeleteSchool(s)}>
                                                    <Trash2 size={16} strokeWidth={1.85} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Create / Edit modal */}
            {showForm && (
                <>
                    <div className="modal-backdrop" onClick={() => setShowForm(false)} />
                    <div className="modal" role="dialog">
                        <div className="modal-header">
                            <h2>{t(editingId
                                ? (tab === 'regions' ? 'admin.orgs.editRegionTitle' : 'admin.orgs.editSchoolTitle')
                                : (tab === 'regions' ? 'admin.orgs.newRegionTitle' : 'admin.orgs.newSchoolTitle'))}</h2>
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
                                {tab === 'regions' ? (
                                    <div className="admin-form-grid">
                                        <div className="input-group">
                                            <label className="input-label">{t('admin.orgs.name')}</label>
                                            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('admin.orgs.code')}</label>
                                            <input className="input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t('admin.orgs.codePlaceholder')} />
                                        </div>
                                        <div className="input-group full">
                                            <label className="input-label">{t('admin.orgs.description')}</label>
                                            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="admin-form-grid">
                                        <div className="input-group">
                                            <label className="input-label">{t('admin.orgs.name')}</label>
                                            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('admin.orgs.schoolNumber')}</label>
                                            <input className="input" required value={form.school_number} onChange={(e) => setForm({ ...form, school_number: e.target.value })} placeholder={t('admin.orgs.schoolNumberPlaceholder')} />
                                        </div>
                                        <div className="input-group full">
                                            <label className="input-label">{t('admin.orgs.region')}</label>
                                            <select className="input" required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                                                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group full">
                                            <label className="input-label">{t('admin.orgs.address')}</label>
                                            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('admin.orgs.phone')}</label>
                                            <input className="input" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('admin.orgs.email')}</label>
                                            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                        </div>
                                        <div className="input-group full">
                                            <label className="input-label">{t('admin.orgs.principal')}</label>
                                            <input className="input" value={form.principal_name} onChange={(e) => setForm({ ...form, principal_name: e.target.value })} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default OrganizationManagementPage;
