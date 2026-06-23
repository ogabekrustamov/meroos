import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { newsService } from '../../services';
import { localeFromLng } from '../../i18n';
import { useAuth, useToast } from '../../contexts';
import type { NewsPost, NewsComment } from '../../types';

const NewsDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const toast = useToast();
    const { t, i18n } = useTranslation();

    const [post, setPost] = useState<NewsPost | null>(null);
    const [comments, setComments] = useState<NewsComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentContent, setCommentContent] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyTo, setReplyTo] = useState<number | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!id) return;
            try {
                const [postData, commentsData] = await Promise.all([
                    newsService.getPost(Number(id)),
                    newsService.getComments(Number(id))
                ]);
                setPost(postData);
                setComments(commentsData);
            } catch (error) {
                console.error('Failed to fetch news post:', error);
                navigate('/news');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id, navigate]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !commentContent.trim()) return;

        setSubmittingComment(true);
        try {
            const newComment = await newsService.addComment(Number(id), commentContent, replyTo || undefined);

            if (replyTo) {
                // If it's a reply, update the specific parent comment
                setComments(comments.map(c => {
                    if (c.id === replyTo) {
                        return { ...c, replies: [...(c.replies || []), newComment] };
                    }
                    return c;
                }));
            } else {
                // Otherwise it's a top-level comment
                setComments([...comments, newComment]);
            }

            setCommentContent('');
            setReplyTo(null);
        } catch (error) {
            console.error('Failed to add comment:', error);
            toast.error(t('news.detail.postFailed'));
        } finally {
            setSubmittingComment(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(localeFromLng(i18n.language), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="max-w-4xl mx-auto" style={{ padding: 'var(--space-6)' }}>
            <button
                onClick={() => navigate('/news')}
                className="btn btn-secondary mb-6"
                style={{ marginBottom: 'var(--space-6)' }}
            >
                {t('news.detail.back')}
            </button>

            <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {post.featured_image && (
                    <div style={{ width: '100%', height: '400px', overflow: 'hidden' }}>
                        <img
                            src={post.featured_image}
                            alt={post.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                )}

                <div style={{ padding: 'var(--space-8)' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="badge badge-primary">{post.category.name}</span>
                        <span className="text-secondary text-sm">{formatDate(post.published_at)}</span>
                        <span className="text-secondary text-sm">•</span>
                        <span className="text-secondary text-sm">{t('news.detail.views', { count: post.view_count })}</span>
                    </div>

                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: 'var(--space-4)', lineHeight: 1.2 }}>
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            {post.author.avatar ? (
                                <img
                                    src={post.author.avatar}
                                    alt={post.author.full_name}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'var(--primary)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold'
                                }}>
                                    {post.author?.full_name?.[0] || post.author?.username?.[0] || '?'}
                                </div>
                            )}
                            <div>
                                <div style={{ fontWeight: '500' }}>{post.author?.full_name || post.author?.username || t('news.detail.unknownAuthor')}</div>
                                <div className="text-sm text-secondary">{t('news.detail.author')}</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {(user?.role === 'superuser' || (hasPermission('can_edit_news') && post.author.id === user?.id)) && (
                                <Link to={`/news/${post.id}/edit`} className="btn btn-secondary">
                                    {t('news.detail.editPost')}
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="prose max-w-none" style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                        {/* If you have rich text content, you'd use dangerouslySetInnerHTML here safely, assuming the backend sanitizes it. 
                            For now, assuming plain text or simple markdown handling could be added later. 
                            Using white-space pre-wrap for preserving formatting if it uses newlines 
                        */}
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                            {post.content || post.excerpt}
                        </div>
                    </div>
                </div>
            </article>

            {/* Comments Section */}
            <div className="mt-8" style={{ marginTop: 'var(--space-8)' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>
                    {t('news.detail.comments', { count: comments.length })}
                </h3>

                <form onSubmit={handleCommentSubmit} className="mb-8" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="form-group">
                        <textarea
                            className="input"
                            rows={3}
                            placeholder={replyTo ? t('news.detail.writeReply') : t('news.detail.addComment')}
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        {replyTo ? (
                            <button
                                type="button"
                                className="btn btn-secondary text-sm"
                                onClick={() => {
                                    setReplyTo(null);
                                    setCommentContent('');
                                }}
                            >
                                {t('news.detail.cancelReply')}
                            </button>
                        ) : <div></div>}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submittingComment}
                        >
                            {submittingComment ? t('news.detail.posting') : (replyTo ? t('news.detail.postReply') : t('news.detail.postComment'))}
                        </button>
                    </div>
                </form>

                <div className="flex flex-col gap-4">
                    {Array.isArray(comments) && comments.map((comment) => (
                        <div key={comment.id} className="card" style={{ padding: 'var(--space-4)' }}>
                            <div className="flex items-start gap-3">
                                {comment.author_avatar ? (
                                    <img
                                        src={comment.author_avatar}
                                        alt={comment.author_full_name}
                                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: 'var(--secondary)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem'
                                    }}>
                                        {comment.author_full_name?.[0] || comment.author_username?.[0] || '?'}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span style={{ fontWeight: '600' }}>
                                            {comment.author_full_name || comment.author_username || t('news.detail.unknown')}
                                        </span>
                                        <span className="text-sm text-secondary">
                                            {formatDate(comment.created_at)}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        {comment.content}
                                    </p>
                                    <div className="mt-2">
                                        <button
                                            onClick={() => setReplyTo(comment.id)}
                                            className="text-sm font-medium"
                                            style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            {t('news.detail.reply')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Render Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-4 flex flex-col gap-3" style={{ marginLeft: '40px', paddingLeft: '16px', borderLeft: '2px solid var(--border)' }}>
                                    {comment.replies.map((reply) => (
                                        <div key={reply.id} className="flex items-start gap-3">
                                            {reply.author_avatar ? (
                                                <img
                                                    src={reply.author_avatar}
                                                    alt={reply.author_full_name}
                                                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '28px', height: '28px', borderRadius: '50%',
                                                    background: 'var(--secondary)', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {reply.author_full_name?.[0] || reply.author_username?.[0] || '?'}
                                                </div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                                        {reply.author_full_name || reply.author_username || t('news.detail.unknown')}
                                                    </span>
                                                    <span className="text-xs text-secondary">
                                                        {formatDate(reply.created_at)}
                                                    </span>
                                                </div>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                                    {reply.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <p className="text-center text-secondary py-4">{t('news.detail.noComments')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsDetailPage;
