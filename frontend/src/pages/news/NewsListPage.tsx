import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { newsService } from '../../services';
import type { NewsPost, NewsCategory } from '../../types';

const NewsListPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postsData, categoriesData] = await Promise.all([
                    newsService.getPosts({ category: selectedCategory }),
                    newsService.getCategories(),
                ]);
                setPosts(postsData.results);
                setCategories(categoriesData);
            } catch (error) {
                console.error('Failed to fetch news:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory]);

    const canCreate = user?.role === 'superuser' || (user?.role === 'teacher' && hasPermission('can_create_news'));

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    // Featured posts
    const featuredPosts = posts.filter((p) => p.is_featured || p.is_pinned);
    const regularPosts = posts.filter((p) => !p.is_featured && !p.is_pinned);

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 className="page-title">News & Announcements</h1>
                    <p className="text-secondary">Stay updated with the latest news and announcements</p>
                </div>
                {canCreate && (
                    <Link to="/news/create" className="btn btn-primary">
                        + Create Post
                    </Link>
                )}
            </div>

            {/* Categories */}
            <div className="flex gap-2" style={{ marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                <button
                    className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory(undefined)}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
                <div style={{ marginBottom: 'var(--space-8)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                        📌 Featured
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                        {featuredPosts.map((post) => (
                            <Link key={post.id} to={`/news/${post.id}`} className="card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                                {post.featured_image && (
                                    <div style={{ height: '200px', overflow: 'hidden' }}>
                                        <img
                                            src={post.featured_image}
                                            alt={post.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                                <div className="card-body flex-1 flex flex-col">
                                    <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
                                        <span className="badge badge-primary">{post.category?.name}</span>
                                        {post.is_pinned && <span className="badge badge-warning">Pinned</span>}
                                    </div>
                                    <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
                                        {post.title}
                                    </h3>
                                    <p className="text-secondary mb-4 flex-1">
                                        {post.excerpt}
                                    </p>
                                    <div className="mt-auto">
                                        <div className="flex items-center justify-between text-sm text-muted mb-4">
                                            <div className="flex items-center gap-4">
                                                <span>{formatDate(post.published_at)}</span>
                                                <span>👁️ {post.view_count}</span>
                                            </div>
                                        </div>
                                        <div className="btn btn-primary w-full text-center">
                                            Read More
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Regular Posts */}
            <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                    Recent Posts
                </h2>
                <div className="flex flex-col gap-4">
                    {regularPosts.map((post) => (
                        <Link key={post.id} to={`/news/${post.id}`} className="card" style={{ textDecoration: 'none' }}>
                            <div className="card-body flex gap-6">
                                {post.featured_image && (
                                    <div style={{ width: '200px', height: '140px', flexShrink: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                                        <img
                                            src={post.featured_image}
                                            alt={post.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                                        <span className="badge badge-secondary">{post.category?.name}</span>
                                        <span className="text-sm text-muted">{formatDate(post.published_at)}</span>
                                    </div>
                                    <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>
                                        {post.title}
                                    </h3>
                                    <p className="text-secondary text-sm mb-4">{post.excerpt}</p>

                                    <div className="mt-auto flex justify-between items-center">
                                        <div className="btn btn-primary btn-sm">Read More</div>
                                        <div className="flex items-center justify-between text-sm text-muted">
                                            <div className="flex items-center gap-4">
                                                <span>By {post.author?.full_name || post.author?.username}</span>
                                                <span>👁️ {post.view_count}</span>
                                            </div>
                                            {(user?.role === 'superuser' || (hasPermission('can_edit_news') && post.author?.id === user?.id)) && (
                                                <div className="flex gap-2 ml-4" onClick={(e) => e.preventDefault()}>
                                                    <Link to={`/news/${post.id}/edit`} className="btn btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-sm)' }}>✏️</Link>
                                                    {(user?.role === 'superuser' || hasPermission('can_delete_news')) && (
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--error)' }}
                                                            onClick={async () => {
                                                                if (window.confirm(`Delete "${post.title}"?`)) {
                                                                    try {
                                                                        await newsService.deletePost(post.id);
                                                                        setPosts((prev) => prev.filter((p) => p.id !== post.id));
                                                                    } catch (err) {
                                                                        console.error('Failed to delete post:', err);
                                                                    }
                                                                }
                                                            }}
                                                        >🗑️</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {posts.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📰</div>
                    <h3 className="empty-state-title">No posts found</h3>
                    <p className="empty-state-description">Check back later for news and announcements!</p>
                </div>
            )}
        </div>
    );
};

export default NewsListPage;
