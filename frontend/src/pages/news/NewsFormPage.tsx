import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts';
import { newsService } from '../../services';
import type { NewsCategory } from '../../types';

interface NewsFormData {
    title: string;
    excerpt: string;
    content: string;
    category: number | '';
    post_type: 'announcement' | 'news' | 'event' | 'update';
    is_featured: boolean;
    is_pinned: boolean;
    featured_image: File | null;
    existing_image: string | null;
}

const NewsFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const { t } = useTranslation();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState<NewsFormData>({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        post_type: 'news',
        is_featured: false,
        is_pinned: false,
        featured_image: null,
        existing_image: null,
    });

    // Check permissions
    const canCreate = user?.role === 'superuser' || (user?.role === 'teacher' && hasPermission('can_create_news'));
    const canEdit = user?.role === 'superuser' || (user?.role === 'teacher' && hasPermission('can_edit_news'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const catsData = await newsService.getCategories();
                setCategories(catsData);

                if (isEditing) {
                    const post = await newsService.getPost(Number(id));
                    setFormData({
                        title: post.title,
                        excerpt: post.excerpt || '',
                        content: post.content || '',
                        category: post.category?.id || '',
                        post_type: (post.post_type as 'announcement' | 'news' | 'event' | 'update') || 'news',
                        is_featured: post.is_featured || false,
                        is_pinned: post.is_pinned || false,
                        featured_image: null,
                        existing_image: post.featured_image || null,
                    });
                    if (post.featured_image) {
                        setPreviewUrl(post.featured_image);
                    }
                }
            } catch (err) {
                console.error('Failed to load data:', err);
                setError(t('news.form.loadFailed'));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    // Permission check
    if (!loading && ((isEditing && !canEdit) || (!isEditing && !canCreate))) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon"><Ban size={64} strokeWidth={1.75} /></div>
                <h3 className="empty-state-title">{t('news.form.accessDenied')}</h3>
                <p className="empty-state-description">
                    {isEditing ? t('news.form.noPermissionEdit') : t('news.form.noPermissionCreate')}
                </p>
            </div>
        );
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, featured_image: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('excerpt', formData.excerpt);
            data.append('content', formData.content);
            if (formData.category) {
                data.append('category', formData.category.toString());
            }
            data.append('post_type', formData.post_type);
            data.append('is_featured', formData.is_featured.toString());
            data.append('is_pinned', formData.is_pinned.toString());
            if (formData.featured_image) {
                data.append('featured_image', formData.featured_image);
            }

            if (isEditing) {
                await newsService.updatePost(Number(id), data);
            } else {
                await newsService.createPost(data);
            }
            navigate('/news');
        } catch (err: any) {
            console.error('Failed to save post:', err);
            setError(err.response?.data?.detail || t('news.form.saveFailed'));
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

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                    <h1 className="page-title">{isEditing ? t('news.form.editTitle') : t('news.form.createTitle')}</h1>
                    <p className="text-secondary">
                        {isEditing ? t('news.form.editSubtitle') : t('news.form.createSubtitle')}
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
                                    <label className="form-label">{t('news.form.titleLabel')}</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.title}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="form-label">{t('news.form.excerpt')}</label>
                                    <textarea
                                        className="input"
                                        rows={2}
                                        placeholder={t('news.form.excerptPlaceholder')}
                                        value={formData.excerpt}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('news.form.content')}</label>
                                    <textarea
                                        className="input"
                                        rows={12}
                                        placeholder={t('news.form.contentPlaceholder')}
                                        value={formData.content}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div style={{ gridColumn: 'span 1' }}>
                        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                            <div className="card-body">
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>{t('news.form.postSettings')}</h3>

                                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="form-label">{t('news.form.categoryLabel')}</label>
                                    <select
                                        className="input"
                                        value={formData.category}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value ? Number(e.target.value) : '' }))}
                                        required
                                    >
                                        <option value="">{t('news.form.selectCategory')}</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="form-label">{t('news.form.postType')}</label>
                                    <select
                                        className="input"
                                        value={formData.post_type}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, post_type: e.target.value as any }))}
                                    >
                                        <option value="news">{t('news.postTypes.news')}</option>
                                        <option value="announcement">{t('news.postTypes.announcement')}</option>
                                        <option value="event">{t('news.postTypes.event')}</option>
                                        <option value="update">{t('news.postTypes.update')}</option>
                                    </select>
                                </div>

                                <div className="flex gap-4" style={{ marginBottom: 'var(--space-4)' }}>
                                    <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))}
                                        />
                                        {t('news.form.featured')}
                                    </label>
                                    <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_pinned}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, is_pinned: e.target.checked }))}
                                        />
                                        {t('news.form.pinned')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>{t('news.form.featuredImage')}</h3>

                                {previewUrl && (
                                    <div style={{ marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 justify-end" style={{ marginTop: 'var(--space-6)' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/news')}>
                        {t('news.form.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? t('news.form.saving') : isEditing ? t('news.form.updatePost') : t('news.form.publishPost')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewsFormPage;
