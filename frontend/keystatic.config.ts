import { config, fields, collection } from '@keystatic/core';

export default config({
    storage: {
        kind: 'local',
    },
    collections: {
        posts: collection({
            label: 'Blog Posts',
            slugField: 'title',
            path: 'src/content/blog/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.slug({ name: { label: 'Title' } }),
                excerpt: fields.text({ label: 'Excerpt', multiline: true }),
                // Categories as simple text for now
                category: fields.text({ label: 'Category' }),
                readTime: fields.text({ label: 'Read Time' }),
                date: fields.text({ label: 'Date' }),
                image: fields.text({ label: 'Image URL' }),
                featured: fields.checkbox({ label: 'Featured' }),
                // Simplified array definition
                keywords: fields.array(fields.text({ label: 'Keyword' }), {
                    label: 'Keywords',
                    itemLabel: (props) => props.value
                }),
                content: fields.mdx({
                    label: 'Content',
                }),
            },
        }),
    },
});
