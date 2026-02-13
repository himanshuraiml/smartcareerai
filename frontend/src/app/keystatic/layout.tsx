import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Keystatic Admin',
    description: 'Admin dashboard for PlaceNxt Blog',
};

export default function KeystaticLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head />
            <body>
                {children}
            </body>
        </html>
    );
}


