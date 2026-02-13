import { getAllPosts, getAllCategories } from '@/lib/blog';
import BlogList from './BlogList';

export default function BlogPage() {
    const posts = getAllPosts();
    const categories = getAllCategories();

    return <BlogList initialPosts={posts} categories={categories} />;
}


