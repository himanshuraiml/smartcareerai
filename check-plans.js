const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.subscriptionPlan.findMany()
  .then(r => console.log(JSON.stringify(r.map(x => ({ name: x.name, features: x.features })), null, 2)))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());
