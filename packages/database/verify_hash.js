const bcrypt = require('bcryptjs');

const adminPass = 'Admin123!';
const recruiterPass = 'Recruiter123!';

const adminHash = bcrypt.hashSync(adminPass, 12);
const recruiterHash = bcrypt.hashSync(recruiterPass, 12);

console.log('--- ADMIN HASH ---');
console.log(adminHash);
console.log('--- RECRUITER HASH ---');
console.log(recruiterHash);

