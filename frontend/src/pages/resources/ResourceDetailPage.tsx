import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resourceService } from '../../services';
import { useAuth } from '../../contexts';
import type { Resource } from '../../types';

const ResourceDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();

    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResource = async () => {
            if (!id) return;
            try {
                const data = await resourceService.getResource(Number(id));
                setResource(data);
            } catch (error) {
                console.error('Failed to fetch resource:', error);
                navigate('/resources');
            } finally {
                setLoading(false);
            }

            // Track view in background, don't block render
            try {
                if (id) await resourceService.viewResource(Number(id));
            } catch (err) {
                // Ignore view tracking errors
                console.warn('Failed to track view:', err);
            }
        };
        fetchResource();
    }, [id, navigate]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return '🎥';
            case 'pdf': return '📄';
            case 'link': return '🔗';
            case 'document': return '📝';
            case 'image': return '🖼️';
            default: return '📁';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getEmbedUrl = (url: string | null | undefined) => {
        if (!url) return '';

        // Handle standard watch URL: youtube.com/watch?v=ID
        const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
        if (watchMatch && watchMatch[1]) {
            return `https://www.youtube.com/embed/${watchMatch[1]}`;
        }

        // Handle embed URL: youtube.com/embed/ID
        const embedMatch = url.match(/youtube\.com\/embed\/([\w-]{11})/);
        if (embedMatch && embedMatch[1]) {
            return url;
        }

        return url;
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!resource) return null;

    return (
        <div className="max-w-4xl mx-auto" style={{ padding: 'var(--space-6)' }}>
            <button
                onClick={() => navigate('/resources')}
                className="btn btn-secondary mb-6"
                style={{ marginBottom: 'var(--space-6)' }}
            >
                ← Back to Resources
            </button>

            <div className="card">
                <div className="card-body">
                    <div className="flex items-center gap-4 mb-6" style={{ marginBottom: 'var(--space-6)' }}>
                        <div style={{
                            fontSize: '3rem',
                            background: 'var(--bg-secondary)',
                            width: '80px', height: '80px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            {getTypeIcon(resource.resource_type)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-primary">{resource.category.name}</span>
                                <span className="text-secondary text-sm">{formatDate(resource.created_at)}</span>
                            </div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                {resource.title}
                            </h1>
                        </div>
                    </div>

                    {/* Preview Section - Simplified logic based on type */}
                    {((resource.resource_type === 'video' && resource.video_url) ||
                        (resource.resource_type === 'link' && resource.external_url && (resource.external_url.includes('youtube.com') || resource.external_url.includes('youtu.be')))) && (
                            <div className="mb-8" style={{ marginBottom: 'var(--space-8)' }}>
                                <div className="aspect-w-16 aspect-h-9" style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                                    {/* Basic YouTube embed support or direct video */}
                                    {((resource.video_url && (resource.video_url.includes('youtube.com') || resource.video_url.includes('youtu.be'))) ||
                                        (resource.external_url && (resource.external_url.includes('youtube.com') || resource.external_url.includes('youtu.be')))) ? (
                                        <iframe
                                            src={getEmbedUrl(resource.video_url || resource.external_url)}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            title={resource.title}
                                        />
                                    ) : (
                                        resource.video_url ? (
                                            <video controls src={resource.video_url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                                        ) : null
                                    )}
                                </div>
                            </div>
                        )}

                    {resource.resource_type === 'image' && resource.file && (
                        <div className="mb-8" style={{ marginBottom: 'var(--space-8)' }}>
                            <img
                                src={resource.file}
                                alt={resource.title}
                                style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-8" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)', fontWeight: '600' }}>Description</h3>
                            <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                {resource.description || 'No description provided.'}
                            </p>
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', alignSelf: 'start' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)', fontWeight: '600' }}>Resource Info</h3>

                            <div className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-secondary">Uploaded by</span>
                                    <span style={{ fontWeight: 500 }}>{resource.uploaded_by?.full_name || resource.uploaded_by?.username || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Type</span>
                                    <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{resource.resource_type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Views</span>
                                    <span style={{ fontWeight: 500 }}>{resource.view_count}</span>
                                </div>
                                {resource.allow_download && (
                                    <div className="flex justify-between">
                                        <span className="text-secondary">Downloads</span>
                                        <span style={{ fontWeight: 500 }}>{resource.download_count}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200" style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-color)' }}>
                                {resource.allow_download && (
                                    <a
                                        href={resourceService.getDownloadUrl(resource.id)}
                                        className="btn btn-primary w-full center"
                                        style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}
                                        download
                                    >
                                        Download Resource
                                    </a>
                                )}

                                {resource.resource_type === 'link' && resource.video_url && (
                                    <a
                                        href={resource.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary w-full center"
                                        style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}
                                    >
                                        Visit Link
                                    </a>
                                )}

                                {(user?.role === 'superuser' || (hasPermission('can_edit_resources') && resource.uploaded_by?.id === user?.id)) && (
                                    <Link
                                        to={`/resources/${resource.id}/edit`}
                                        className="btn btn-secondary w-full center"
                                        style={{ display: 'flex', justifyContent: 'center' }}
                                    >
                                        Edit Resource
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceDetailPage;
