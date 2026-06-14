import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { resourceService } from '../../services';
import type { ResourceCategory } from '../../types';

interface ResourceFormData {
    title: string;
    description: string;
    category: number | '';
    resource_type: string; // Can be video, pdf, link, document, presentation, post
    external_url: string;
    allow_download: boolean;
    is_published: boolean;
    file: File | null;
    existing_file: string | null;
    thumbnail: File | null;
    existing_thumbnail: string | null;
}

const ResourceFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<ResourceCategory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState<ResourceFormData>({
        title: '',
        description: '',
        category: '',
        resource_type: 'document',
        external_url: '',
        allow_download: true,
        is_published: true,
        file: null,
        existing_file: null,
        thumbnail: null,
        existing_thumbnail: null,
    });

    // Check permissions
    const canUpload = user?.role === 'superuser' || (user?.role === 'teacher' && hasPermission('can_upload_resources'));
    const canEdit = user?.role === 'superuser' || (user?.role === 'teacher' && hasPermission('can_edit_resources'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const catsData = await resourceService.getCategories();
                setCategories(catsData);

                if (isEditing) {
                    const resource: any = await resourceService.getResource(Number(id));
                    setFormData({
                        title: resource.title,
                        description: resource.description || '',
                        category: resource.category?.id || '',
                        resource_type: resource.resource_type as any,
                        external_url: resource.external_url || resource.video_url || '',
                        allow_download: resource.allow_download ?? true,
                        is_published: resource.is_published ?? true,
                        file: null,
                        existing_file: resource.file || null,
                        thumbnail: null,
                        existing_thumbnail: resource.thumbnail || null,
                    });
                    if (resource.thumbnail) {
                        setThumbnailPreview(resource.thumbnail);
                    }
                }
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load resource data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    // Permission check
    if (!loading && ((isEditing && !canEdit) || (!isEditing && !canUpload))) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🚫</div>
                <h3 className="empty-state-title">Access Denied</h3>
                <p className="empty-state-description">
                    You don't have permission to {isEditing ? 'edit' : 'upload'} resources.
                </p>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, file }));
        }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, thumbnail: file }));
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            if (formData.category) {
                data.append('category', formData.category.toString());
            }
            data.append('resource_type', formData.resource_type);
            if (formData.external_url) {
                data.append('external_url', formData.external_url);
            }
            data.append('allow_download', formData.allow_download.toString());
            data.append('is_published', formData.is_published.toString());
            if (formData.file) {
                data.append('file', formData.file);
            }
            if (formData.thumbnail) {
                data.append('thumbnail', formData.thumbnail);
            }

            if (isEditing) {
                await resourceService.updateResource(Number(id), data);
            } else {
                await resourceService.uploadResource(data);
            }
            navigate('/resources');
        } catch (err: any) {
            console.error('Failed to save resource:', err);
            setError(err.response?.data?.detail || 'Failed to save resource');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return '🎥';
            case 'pdf': return '📄';
            case 'link': return '🔗';
            case 'document': return '📝';
            case 'presentation': return '📊';
            case 'post': return '📰';
            default: return '📁';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 className="page-title">{isEditing ? 'Edit Resource' : 'Upload Resource'}</h1>
                    <p className="text-secondary">
                        {isEditing ? 'Update your resource details' : 'Share educational materials with your students'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="badge badge-error" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', display: 'block' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <div className="card">
                            <div className="card-body">
                                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="form-label">Title *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.title}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="input"
                                        rows={4}
                                        placeholder="Describe the resource..."
                                        value={formData.description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="form-label">Resource Type *</label>
                                    <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                                        {['document', 'video', 'pdf', 'link', 'presentation', 'post'].map((type) => (
                                            <label
                                                key={type}
                                                className={`card ${formData.resource_type === type ? 'active' : ''}`}
                                                style={{
                                                    padding: 'var(--space-4)',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    minWidth: '100px',
                                                    border: formData.resource_type === type ? '2px solid var(--primary)' : undefined,
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="resource_type"
                                                    value={type}
                                                    checked={formData.resource_type === type}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, resource_type: e.target.value as any }))}
                                                    style={{ display: 'none' }}
                                                />
                                                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-1)' }}>{getTypeIcon(type)}</div>
                                                <div style={{ textTransform: 'capitalize' }}>{type}</div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {formData.resource_type === 'link' ? (
                                    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                        <label className="form-label">External URL *</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://..."
                                            value={formData.external_url}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, external_url: e.target.value }))}
                                            required={formData.resource_type === 'link'}
                                        />
                                    </div>
                                ) : (
                                    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                        <label className="form-label">File {!isEditing && '*'}</label>
                                        {formData.existing_file && (
                                            <div className="text-sm text-muted" style={{ marginBottom: 'var(--space-2)' }}>
                                                Current file: {formData.existing_file.split('/').pop()}
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            required={!isEditing && formData.resource_type !== 'link'}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div style={{ gridColumn: 'span 1' }}>
                        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                            <div className="card-body">
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>Settings</h3>

                                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="form-label">Category *</label>
                                    <select
                                        className="input"
                                        value={formData.category}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value ? Number(e.target.value) : '' }))}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.allow_download}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, allow_download: e.target.checked }))}
                                        />
                                        Allow download
                                    </label>
                                    <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_published}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.checked }))}
                                        />
                                        Published (visible to users)
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>Thumbnail</h3>

                                {thumbnailPreview && (
                                    <div style={{ marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                                        <img src={thumbnailPreview} alt="Preview" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 justify-end" style={{ marginTop: 'var(--space-6)' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/resources')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : isEditing ? 'Update Resource' : 'Upload Resource'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ResourceFormPage;
