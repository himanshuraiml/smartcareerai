const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function resetToFree() {
  // Get free plan ID
  const freePlan = await p.subscriptionPlan.findUnique({ where: { name: 'free' } });

  if (!freePlan) {
    console.log('Free plan not found!');
    return;
  }

  // Update user's subscription to free plan
  const updated = await p.userSubscription.update({
    where: { userId: '76d36724-366d-4000-b32b-c98d8de2e829' },
    data: {
      planId: freePlan.id,
      razorpaySubscriptionId: null,
      razorpayCustomerId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    include: { plan: true }
  });

  console.log('Subscription reset to:', updated.plan.name);
}

resetToFree()
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());
