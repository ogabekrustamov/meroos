import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, FileText, Link2, Image as ImageIcon, Folder, Eye, Download, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts';
import { resourceService } from '../../services';
import type { Resource, ResourceCategory } from '../../types';

const ResourceListPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const { t } = useTranslation();
    const [resources, setResources] = useState<Resource[]>([]);
    const [categories, setCategories] = useState<ResourceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
    const [selectedType, setSelectedType] = useState<string | undefined>();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resourcesData, categoriesData] = await Promise.all([
                    resourceService.getResources({
                        category: selectedCategory,
                        resource_type: selectedType,
                    }),
                    resourceService.getCategories(),
                ]);
                setResources(resourcesData.results);
                setCategories(categoriesData);
            } catch (error) {
                console.error('Failed to fetch resources:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory, selectedType]);

    const canUpload = user?.role === 'superuser' || (user?.role === 'teacher' && hasPermission('can_upload_resources'));

    const getTypeIcon = (type: string): React.ReactNode => {
        const p = { size: 24, strokeWidth: 1.85 };
        switch (type) {
            case 'video': return <Video {...p} />;
            case 'pdf': return <FileText {...p} />;
            case 'link': return <Link2 {...p} />;
            case 'document': return <FileText {...p} />;
            case 'image': return <ImageIcon {...p} />;
            default: return <Folder {...p} />;
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
            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 className="page-title">{t('resource.list.title')}</h1>
                    <p className="text-secondary">{t('resource.list.subtitle')}</p>
                </div>
                {canUpload && (
                    <Link to="/resources/upload" className="btn btn-primary">
                        {t('resource.list.upload')}
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4" style={{ marginBottom: 'var(--space-6)' }}>
                <select
                    className="input"
                    style={{ width: 'auto', minWidth: '180px' }}
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                >
                    <option value="">{t('resource.list.allCategories')}</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select
                    className="input"
                    style={{ width: 'auto', minWidth: '150px' }}
                    value={selectedType || ''}
                    onChange={(e) => setSelectedType(e.target.value || undefined)}
                >
                    <option value="">{t('resource.list.allTypes')}</option>
                    <option value="video">{t('resource.types.video')}</option>
                    <option value="pdf">{t('resource.types.pdf')}</option>
                    <option value="link">{t('resource.types.link')}</option>
                    <option value="document">{t('resource.types.document')}</option>
                </select>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-3 gap-6">
                {resources.map((resource) => (
                    <div key={resource.id} className="card">
                        {resource.thumbnail && (
                            <div style={{ height: '160px', overflow: 'hidden' }}>
                                <img
                                    src={resource.thumbnail}
                                    alt={resource.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        )}
                        <div className="card-body">
                            <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
                                <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(resource.resource_type)}</span>
                                <span className="badge badge-secondary">{resource.category?.name}</span>
                            </div>

                            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>
                                {resource.title}
                            </h3>

                            <p className="text-secondary text-sm" style={{
                                marginBottom: 'var(--space-4)',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}>
                                {resource.description || t('resource.list.noDescription')}
                            </p>

                            <div className="flex gap-4 text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                                <span><Eye size={15} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {resource.view_count}</span>
                                {resource.allow_download && <span><Download size={15} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {resource.download_count}</span>}
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    to={`/resources/${resource.id}`}
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    {t('common.view')}
                                </Link>
                                {resource.allow_download && (
                                    <a
                                        href={resourceService.getDownloadUrl(resource.id)}
                                        className="btn btn-secondary"
                                        download
                                    >
                                        <Download size={18} strokeWidth={1.85} />
                                    </a>
                                )}
                                {(user?.role === 'superuser' || (hasPermission('can_edit_resources') && resource.uploaded_by?.id === user?.id)) && (
                                    <Link
                                        to={`/resources/${resource.id}/edit`}
                                        className="btn btn-secondary"
                                        title={t('resource.list.editResource')}
                                    >
                                        <Pencil size={18} strokeWidth={1.85} />
                                    </Link>
                                )}
                                {(user?.role === 'superuser' || (hasPermission('can_delete_resources') && resource.uploaded_by?.id === user?.id)) && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ color: 'var(--error)' }}
                                        title={t('resource.list.deleteResource')}
                                        onClick={async () => {
                                            if (window.confirm(t('resource.list.deleteConfirm', { title: resource.title }))) {
                                                try {
                                                    await resourceService.deleteResource(resource.id);
                                                    setResources((prev) => prev.filter((r) => r.id !== resource.id));
                                                } catch (err) {
                                                    console.error('Failed to delete resource:', err);
                                                    alert(t('resource.list.deleteFailed'));
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 size={18} strokeWidth={1.85} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {resources.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon"><BookOpen size={64} strokeWidth={1.75} /></div>
                    <h3 className="empty-state-title">{t('resource.list.noResourcesFound')}</h3>
                    <p className="empty-state-description">
                        {selectedCategory || selectedType
                            ? t('resource.list.adjustFilters')
                            : t('resource.list.checkBackLater')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ResourceListPage;
