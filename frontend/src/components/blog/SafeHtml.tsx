'use client';

import DOMPurify from 'dompurify';

interface Props {
    html: string;
    className?: string;
}

export default function SafeHtml({ html, className }: Props) {
    const clean = typeof window !== 'undefined' ? DOMPurify.sanitize(html) : html;
    return <article className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
