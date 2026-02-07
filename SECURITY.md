# Security Documentation

This document outlines the security measures, firewall rules, and OWASP compliance checklist for the PlaceNxt application.

## Table of Contents

1. [Security Architecture Overview](#security-architecture-overview)
2. [Firewall Rules](#firewall-rules)
3. [Rate Limiting](#rate-limiting)
4. [OWASP Top 10 Compliance](#owasp-top-10-compliance)
5. [Security Headers](#security-headers)
6. [Authentication & Authorization](#authentication--authorization)
7. [Data Protection](#data-protection)
8. [Incident Response](#incident-response)

---

## Security Architecture Overview

PlaceNxt implements a defense-in-depth security strategy with multiple layers:

```
Internet → WAF/CDN → Load Balancer → API Gateway → Microservices → Database
                                         ↓
                              Security Middleware
                              - Rate Limiting
                              - Input Sanitization
                              - SQL Injection Prevention
                              - Security Headers
```

---

## Firewall Rules

### Recommended Cloud Firewall Configuration

#### Inbound Rules

| Priority | Source          | Port      | Protocol | Action | Description                    |
|----------|-----------------|-----------|----------|--------|--------------------------------|
| 100      | 0.0.0.0/0      | 443       | TCP      | ALLOW  | HTTPS traffic                  |
| 110      | 0.0.0.0/0      | 80        | TCP      | ALLOW  | HTTP (redirect to HTTPS)       |
| 200      | Internal VPC    | 3000-3012 | TCP      | ALLOW  | Internal service communication |
| 210      | Internal VPC    | 5432      | TCP      | ALLOW  | PostgreSQL (internal only)     |
| 220      | Internal VPC    | 6379      | TCP      | ALLOW  | Redis (internal only)          |
| 230      | Internal VPC    | 9000      | TCP      | ALLOW  | MinIO (internal only)          |
| 300      | Admin IPs       | 22        | TCP      | ALLOW  | SSH (restricted)               |
| 1000     | 0.0.0.0/0      | *         | *        | DENY   | Deny all other traffic         |

#### Outbound Rules

| Priority | Destination     | Port | Protocol | Action | Description              |
|----------|-----------------|------|----------|--------|--------------------------|
| 100      | 0.0.0.0/0      | 443  | TCP      | ALLOW  | HTTPS (APIs, webhooks)   |
| 110      | 0.0.0.0/0      | 80   | TCP      | ALLOW  | HTTP                     |
| 200      | Internal VPC    | *    | TCP      | ALLOW  | Internal communication   |
| 300      | SMTP servers    | 587  | TCP      | ALLOW  | Email sending            |
| 1000     | 0.0.0.0/0      | *    | *        | DENY   | Deny all other traffic   |

### Network Segmentation

```
┌─────────────────────────────────────────────────────────────┐
│                       PUBLIC ZONE                            │
│  - API Gateway (port 3000)                                  │
│  - Frontend (port 3100)                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION ZONE                          │
│  - Auth Service (3001)     - Interview Service (3007)       │
│  - Resume Service (3002)   - Validation Service (3008)      │
│  - Scoring Service (3003)  - Billing Service (3010)         │
│  - Skill Service (3004)    - Admin Service (3011)           │
│  - Job Service (3005)      - Recruiter Service (3012)       │
│  - Application Service (3006)                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA ZONE                              │
│  - PostgreSQL (5432)                                        │
│  - Redis (6379)                                             │
│  - MinIO (9000)                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Rate Limiting

Rate limiting is implemented at the API Gateway level with granular controls:

### Rate Limit Configuration

| Endpoint Type         | Window    | Max Requests | Notes                           |
|-----------------------|-----------|--------------|----------------------------------|
| Authentication        | 15 min    | 10           | Login, register, password reset |
| Password Reset        | 1 hour    | 3            | Strict limit for security       |
| File Uploads          | 1 hour    | 20           | Resume uploads                  |
| AI Operations         | 1 hour    | 50           | Scoring, interviews             |
| General API           | 1 min     | 100          | All other endpoints             |

### Implementation

```typescript
// Authentication rate limiter
authRateLimiter: 15 min window, 10 requests max
keyGenerator: IP + User-Agent combination

// AI rate limiter
aiRateLimiter: 1 hour window, 50 requests max
Applies to: /api/v1/scores/*, /api/v1/interviews/*
```

---

## OWASP Top 10 Compliance

### ✅ A01:2021 – Broken Access Control

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| JWT-based authentication       | ✅     | `auth-service` with secure token handling     |
| Role-based access control      | ✅     | USER, RECRUITER, ADMIN, INSTITUTION_ADMIN     |
| User ID extraction from JWT    | ✅     | Gateway extracts and forwards `x-user-id`     |
| Resource ownership validation  | ✅     | Services validate user owns resource          |

### ✅ A02:2021 – Cryptographic Failures

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| Password hashing               | ✅     | bcrypt with cost factor 12                    |
| TLS/HTTPS enforcement          | ✅     | HSTS header in production                     |
| Secure token generation        | ✅     | crypto.randomBytes for tokens                 |
| Sensitive data encryption      | ✅     | At-rest encryption for PII                    |

### ✅ A03:2021 – Injection

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| SQL injection prevention       | ✅     | Prisma ORM with parameterized queries         |
| SQL pattern detection          | ✅     | `sqlInjectionPrevention` middleware           |
| Input sanitization             | ✅     | `sanitizeInput` middleware                    |
| XSS prevention                 | ✅     | Script tag removal, event handler filtering   |

### ✅ A04:2021 – Insecure Design

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| Defense in depth               | ✅     | Multiple security layers                      |
| Security by design             | ✅     | Microservices isolation                       |
| Input validation               | ✅     | Zod schemas for all inputs                    |
| Error handling                 | ✅     | Centralized error middleware                  |

### ✅ A05:2021 – Security Misconfiguration

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| Security headers               | ✅     | `securityHeaders` middleware                  |
| Default credentials removed    | ✅     | Environment-based configuration               |
| Error messages sanitized       | ✅     | No stack traces in production                 |
| Unnecessary features disabled  | ✅     | Permissions-Policy header                     |

### ✅ A06:2021 – Vulnerable Components

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| Dependency scanning            | ✅     | `npm audit` in CI/CD                          |
| Snyk security scanning         | ✅     | Automated security scans                      |
| Regular updates                | ⚠️     | Monitor and update dependencies               |

### ✅ A07:2021 – Authentication Failures

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| Strong password policy         | ✅     | 8+ chars, uppercase, lowercase, number        |
| Account lockout                | ✅     | Rate limiting on auth endpoints               |
| Secure password recovery       | ✅     | Token-based, time-limited reset               |
| Multi-factor authentication    | ⚠️     | Planned for future implementation             |

### ✅ A08:2021 – Software and Data Integrity

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| CI/CD pipeline security        | ✅     | GitHub Actions with security checks           |
| Signed commits                 | ⚠️     | Recommended for production                    |
| Container image scanning       | ✅     | Docker build in CI/CD                         |

### ✅ A09:2021 – Security Logging and Monitoring

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| Security event logging         | ✅     | Winston logger with security events           |
| Rate limit violation logging   | ✅     | `RATE_LIMIT_AUTH` events                      |
| SQL injection attempt logging  | ✅     | `SQL_INJECTION_ATTEMPT` events                |
| Suspicious activity detection  | ✅     | `SUSPICIOUS_ACTIVITY` events                  |
| Blocked IP logging             | ✅     | `BLOCKED_IP_ACCESS` events                    |

### ✅ A10:2021 – Server-Side Request Forgery (SSRF)

| Control                        | Status | Implementation                                |
|--------------------------------|--------|-----------------------------------------------|
| URL validation                 | ✅     | Whitelist external services                   |
| Internal network protection    | ✅     | Services isolated in private network          |

---

## Security Headers

All responses include the following security headers:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload (production only)
```

---

## Authentication & Authorization

### JWT Token Flow

```
1. User login → auth-service validates credentials
2. auth-service generates JWT (24h) + Refresh Token (30 days)
3. Client stores tokens securely
4. API requests include JWT in Authorization header
5. API Gateway extracts user ID and forwards to services
6. Services validate user permissions
```

### Token Payload

```typescript
{
    id: string;           // User ID
    email: string;        // User email
    role: string;         // USER | RECRUITER | ADMIN | INSTITUTION_ADMIN
    adminForInstitutionId?: string;  // For institution admins
    iat: number;          // Issued at
    exp: number;          // Expiration
}
```

### Role Hierarchy

```
ADMIN
  └── Can manage all users and system settings
INSTITUTION_ADMIN
  └── Can manage users within their institution
RECRUITER
  └── Can view candidates and post jobs
USER
  └── Standard user access
```

---

## Data Protection

### Sensitive Data Handling

| Data Type           | Storage          | Protection                        |
|---------------------|------------------|-----------------------------------|
| Passwords           | PostgreSQL       | bcrypt hash (cost 12)             |
| JWT Secrets         | Environment      | Never committed to repo           |
| API Keys            | Environment      | Encrypted at rest                 |
| User PII            | PostgreSQL       | Column-level encryption           |
| Resume Files        | MinIO            | Server-side encryption            |
| Session Tokens      | Redis            | TTL-based expiration              |

### Data Retention

| Data Type           | Retention        | Deletion Process                  |
|---------------------|------------------|-----------------------------------|
| User Data           | Account lifetime | Cascade delete on account removal |
| Refresh Tokens      | 30 days          | Automatic cleanup                 |
| Session Data        | 24 hours         | TTL expiration                    |
| Logs                | 90 days          | Automated rotation                |

---

## Incident Response

### Security Event Categories

1. **Critical**: Account compromise, data breach
2. **High**: SQL injection attempts, brute force attacks
3. **Medium**: Rate limit violations, suspicious activity
4. **Low**: Invalid login attempts, blocked IPs

### Response Procedures

1. **Detection**: Security logging and monitoring
2. **Analysis**: Review logs and assess impact
3. **Containment**: IP blocking, account suspension
4. **Eradication**: Patch vulnerabilities
5. **Recovery**: Restore services, reset credentials
6. **Post-Incident**: Document and improve

### Contact

For security issues, contact: security@placenxt.com

---

## Security Checklist for Deployment

### Pre-Deployment

- [ ] All environment variables configured
- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] API keys rotated from development
- [ ] Debug mode disabled
- [ ] HTTPS certificates configured
- [ ] Firewall rules applied

### Post-Deployment

- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Authentication flow tested
- [ ] Penetration testing scheduled
- [ ] Monitoring alerts configured
- [ ] Backup procedures verified

### Ongoing

- [ ] Weekly dependency updates review
- [ ] Monthly security audit
- [ ] Quarterly penetration testing
- [ ] Annual security training

---

## Changelog

| Version | Date       | Changes                              |
|---------|------------|--------------------------------------|
| 1.0.0   | 2025-01-31 | Initial security documentation       |
