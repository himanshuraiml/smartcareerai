"use client";

import { useState, useEffect } from "react";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(
        // Already loaded from a previous hook instance (e.g. StrictMode double-mount)
        typeof window !== "undefined" && !!window.Razorpay
    );

    useEffect(() => {
        if (window.Razorpay) {
            setIsLoaded(true);
            return;
        }

        // Reuse an existing <script> tag if one was already injected
        const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
        if (existing) {
            existing.addEventListener("load", () => setIsLoaded(true));
            return;
        }

        const script = document.createElement("script");
        script.src = RAZORPAY_SCRIPT;
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setIsLoaded(false);
        document.body.appendChild(script);
        // Script is intentionally kept in the DOM once added so that
        // subsequent uses don't re-download it.
    }, []);

    return isLoaded;
};

export default useRazorpay;
