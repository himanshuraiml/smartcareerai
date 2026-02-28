'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function CouponRedirect() {
    useEffect(() => {
        redirect('/admin/coupons');
    }, []);

    return null;
}
