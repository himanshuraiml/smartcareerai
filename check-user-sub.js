const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.userSubscription.findUnique({
  where: { userId: '76d36724-366d-4000-b32b-c98d8de2e829' },
  include: { plan: true }
})
.then(sub => {
  if (sub) {
    console.log('User subscription:', {
      status: sub.status,
      planName: sub.plan.name,
      planId: sub.planId
    });
  } else {
    console.log('No subscription found for user');
  }
})
.catch(e => console.error(e))
.finally(() => p.$disconnect());
