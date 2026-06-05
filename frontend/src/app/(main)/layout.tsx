import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { GoogleAuthProviderWrapper } from '@/providers/GoogleAuthProvider';
import KeyboardShortcuts from '@/components/keyboard/KeyboardShortcuts';
import BackToTop from '@/components/ui/BackToTop';
import CookieConsent from '@/components/ui/CookieConsent';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <GoogleAuthProviderWrapper>
            <ThemeProvider>
                {children}
                <KeyboardShortcuts />
                <BackToTop />
                <CookieConsent />
                <PWAInstallPrompt />
                <Toaster />
            </ThemeProvider>
        </GoogleAuthProviderWrapper>
    );
}
