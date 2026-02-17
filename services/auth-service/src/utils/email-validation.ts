import dns from 'dns';
import { promisify } from 'util';
import { AppError } from './errors';
import { logger } from './logger';

const resolveMx = promisify(dns.resolveMx);

// Common disposable email providers
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com',
    'yopmail.com',
    'temp-mail.org',
    'guerrillamail.com',
    '10minutemail.com',
    'throwawaymail.com',
    'sharklasers.com',
    'getairmail.com',
    'mailrop.com',
    'mytemp.email',
    'tempmail.net',
    'tempr.email',
    'trashmail.com',
    'filzmail.com',
    'fleckens.hu',
    'msgsafe.io',
    'mytrashmail.com',
    'binka.me',
    'bobmail.info',
    'chammy.info',
    'devnullmail.com',
    'dreuz.info',
    'dybbuk.de',
    'email-temp.com',
    'flyspam.com',
    'spam4.me',
    'spamgourmet.com',
    'spamhole.com',
    'spaml.de',
    'spammotel.com',
    'tempemail.net',
    'ypmail.webarnak.fr.eu.org',
    'zehnminutenmail.de'
]);

export async function validateEmail(email: string): Promise<void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        throw new AppError('Invalid email format', 400);
    }

    const domain = email.split('@')[1].toLowerCase();

    // Check for disposable email providers
    if (DISPOSABLE_DOMAINS.has(domain)) {
        throw new AppError('Disposable email addresses are not allowed', 400);
    }

    try {
        // Check MX records to ensure domain can receive emails
        const mxRecords = await resolveMx(domain);

        if (!mxRecords || mxRecords.length === 0) {
            throw new AppError('Email domain does not have valid mail servers', 400);
        }
    } catch (error: any) {
        if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
            throw new AppError('Email domain does not exist or cannot receive emails', 400);
        }
        // For DNS timeouts or other errors, we might want to be lenient or log warning
        // In production, you might want to allow it to pass if DNS is flaky, 
        // but here we warn and proceed (or block if strict).
        // Let's log and allow if it's a timeout, but fail if it's strictly not found.
        if (error.code !== 'ENOTFOUND' && error.code !== 'ENODATA') {
            logger.warn(`MX lookup failed for ${domain}: ${error.message}`);
        } else {
            throw new AppError('Invalid email domain', 400);
        }
    }
}
