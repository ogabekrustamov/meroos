// News Types

export interface NewsCategory {
    id: number;
    name: string;
    slug: string;
}

export interface NewsAuthor {
    id: number;
    username: string;
    full_name: string;
    avatar?: string | null;
}

export interface NewsPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content?: string;
    featured_image: string | null;
    post_type: 'news' | 'announcement' | 'article';
    category: NewsCategory;
    author: NewsAuthor;
    published_at: string;
    view_count: number;
    is_featured: boolean;
    is_pinned: boolean;
    created_at: string;
    updated_at?: string;
}

export interface NewsComment {
    id: number;
    content: string;
    author: number; // ID of the author instead of object
    author_username: string;
    author_full_name: string;
    author_avatar?: string | null;
    parent?: number | null;
    replies?: NewsComment[];
    created_at: string;
}
