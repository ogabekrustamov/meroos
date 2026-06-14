// Resource Types

export interface ResourceCategory {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
    total_resources: number;
}

export interface Resource {
    id: number;
    title: string;
    slug: string;
    description: string;
    resource_type: 'video' | 'pdf' | 'link' | 'document' | 'image';
    category: ResourceCategory;
    file?: string | null;
    video_url?: string | null;
    external_url?: string | null;
    video_duration?: number;
    thumbnail?: string | null;
    uploaded_by: {
        id: number;
        username: string;
        full_name?: string;
    };
    view_count: number;
    download_count: number;
    file_size_mb: number;
    allow_download: boolean;
    created_at: string;
    updated_at?: string;
}

export interface ResourceBookmark {
    id: number;
    resource: Resource;
    notes?: string;
    created_at: string;
}

export interface ResourceRating {
    id: number;
    rating: number;
    review?: string;
    created_at: string;
}
