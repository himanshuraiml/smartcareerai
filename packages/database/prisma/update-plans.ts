import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
    {
        name: 'free',
        displayName: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        features: {
            resumeReviews: 3,
            interviews: 1,
            skillTests: 3,
            communitySupport: true,
            priorityEmailSupport: false,
            advancedAnalytics: false,
            dedicatedSuccessManager: false,
        },
        sortOrder: 0,
    },
    {
        name: 'starter',
        displayName: 'Starter',
        priceMonthly: 349,
        priceYearly: 3299,
        razorpayPlanId: 'plan_S6zfvOOu5j9WKA',
        features: {
            resumeReviews: 15,
            interviews: 6,
            skillTests: 10,
            communitySupport: true,
            priorityEmailSupport: true,
            advancedMockInterviews: true,
            advancedAnalytics: false,
            dedicatedSuccessManager: false,
        },
        sortOrder: 1,
    },
    {
        name: 'pro',
        displayName: 'Pro',
        priceMonthly: 849,
        priceYearly: 7999,
        razorpayPlanId: 'plan_S6zgEyCYs0G0Y8',
        features: {
            resumeReviews: 50,
            interviews: 25,
            skillTests: 25,
            communitySupport: true,
            priorityEmailSupport: true,
            advancedMockInterviews: true,
            advancedAnalytics: true,
            profilePromotion: true,
            skillCertificationBadges: true,
            priority24x7Support: true,
            dedicatedSuccessManager: false,
        },
        sortOrder: 2,
    },
    {
        name: 'enterprise',
        displayName: 'Enterprise',
        priceMonthly: 4999,
        priceYearly: 47999,
        razorpayPlanId: 'plan_S6zgnCCDTVKYtc',
        features: {
            resumeReviews: 'unlimited',
            interviews: 'unlimited',
            skillTests: 'unlimited',
            communitySupport: true,
            priorityEmailSupport: true,
            advancedMockInterviews: true,
            advancedAnalytics: true,
            profilePromotion: true,
            skillCertificationBadges: true,
            priority24x7Support: true,
            dedicatedSuccessManager: true,
            customAIModels: true,
            whitelabelReports: true,
            fullAPIAccess: true,
        },
        sortOrder: 3,
    },
];

async function main() {
    for (const plan of plans) {
        await prisma.subscriptionPlan.upsert({
            where: { name: plan.name },
            update: plan,
            create: plan,
        });
        console.log(`✅ Updated plan: ${plan.displayName} — ₹${plan.priceMonthly}/mo`);
    }
    console.log('🎉 All subscription plans updated!');
}

main()
    .catch((e) => { console.error('❌ Failed:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
