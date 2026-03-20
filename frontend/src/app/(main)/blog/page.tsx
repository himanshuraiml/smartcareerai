import { getPublishedPostsFromApi, getAllPublishedCategoriesFromApi } from '@/lib/blog';
import BlogList from './BlogList';

export default async function BlogPage() {
    const [posts, categories] = await Promise.all([
        getPublishedPostsFromApi({ limit: 50 }),
        getAllPublishedCategoriesFromApi(),
    ]);

    return <BlogList initialPosts={posts} categories={categories} />;
}
