import { PrismaClient, LeagueTier } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

// Copy-pasted quiet hours logic from notification.service.ts for validation
function isInQuietHours(prefs: any, simulatedDate: Date): boolean {
    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

    try {
        const tz = prefs.timezone || 'Asia/Kolkata';
        
        // Format current local time in target timezone
        const localTimeString = simulatedDate.toLocaleTimeString('en-US', {
            timeZone: tz,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        const [currentHour, currentMin] = localTimeString.split(':').map(Number);
        const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
        const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);

        const currentTime = currentHour * 60 + currentMin;
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime < endTime) {
            // Interval within same day (e.g. 08:00 to 17:00)
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Interval crosses midnight (e.g. 22:00 to 08:00)
            return currentTime >= startTime || currentTime <= endTime;
        }
    } catch (error) {
        console.error('Error computing quiet hours window:', error);
        return false;
    }
}

// Helper to mock email templates locally
function compileWeeklyDigestTemplate(name: string, streak: number, xpEarned: number, challengesCompleted: number, leagueTier: string, leagueRank: string, outcome: string, skillsHtml: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0f0f23;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#ffffff;">
      <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);padding:32px;">
        <h1 style="color:#818cf8;font-size:24px;margin-top:0;">SmartCareerAI Weekly Report</h1>
        <p>Hi ${name},</p>
        <p>Here is your weekly progress report summarizing your placement preparation activities!</p>
        
        <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin:24px 0;">
          <h3 style="margin-top:0;color:#6366f1;">⚡ THIS WEEK IN NUMBERS</h3>
          <ul style="padding-left:20px;margin:0;">
            <li>🔥 <strong>Streak</strong>: ${streak} days</li>
            <li>⚡ <strong>XP Earned</strong>: ${xpEarned} XP</li>
            <li>🎯 <strong>Challenges Completed</strong>: ${challengesCompleted}</li>
          </ul>
        </div>

        <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin:24px 0;">
          <h3 style="margin-top:0;color:#10b981;">🏆 LEAGUE PERFORMANCE</h3>
          <p style="margin:0;">
            You finished last week in the <strong>${leagueTier} League</strong> at rank <strong>#${leagueRank}</strong>.<br/>
            Outcome: <span style="text-transform:uppercase;font-weight:bold;color:${outcome === 'PROMOTED' ? '#10b981' : outcome === 'DEMOTED' ? '#f43f5e' : '#f59e0b'};">${outcome}</span>
          </p>
        </div>

        <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin:24px 0;">
          <h3 style="margin-top:0;color:#a855f7;">⭐ SKILL PROGRESSION</h3>
          <ul style="padding-left:20px;margin:0;">
            ${skillsHtml}
          </ul>
        </div>
      </div>
    </body>
    </html>`;
}

async function cleanTestData(testUserEmail: string) {
    const user = await prisma.user.findUnique({ where: { email: testUserEmail } });
    if (user) {
        await prisma.notification.deleteMany({ where: { userId: user.id } });
        await prisma.notificationPreference.deleteMany({ where: { userId: user.id } });
        await prisma.leagueMembership.deleteMany({ where: { userId: user.id } });
        await prisma.userLeagueHistory.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    }
    const mockUsers = await prisma.user.findMany({
        where: { email: { startsWith: 'league-mock-' } }
    });
    for (const mockUser of mockUsers) {
        await prisma.notification.deleteMany({ where: { userId: mockUser.id } });
        await prisma.notificationPreference.deleteMany({ where: { userId: mockUser.id } });
        await prisma.leagueMembership.deleteMany({ where: { userId: mockUser.id } });
        await prisma.userLeagueHistory.deleteMany({ where: { userId: mockUser.id } });
        await prisma.user.delete({ where: { id: mockUser.id } });
    }
}

async function runTests() {
    console.log('🧪 Starting Phase 3 Re-Engagement System Verification...');

    const testUserEmail = 'test-phase3-user@smartcareer.com';
    await cleanTestData(testUserEmail);

    // ----------------------------------------------------
    // TEST 1: User Signup & Preference Initialization
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Preference Creation & Retrieval ---');
    const user = await prisma.user.create({
        data: {
            email: testUserEmail,
            passwordHash: 'dummyhash',
            name: 'Test Phase 3 Student',
            isVerified: true,
            xp: 50,
            streakCount: 4,
            lastLoginAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago (for inactivity check)
        }
    });
    console.log(`Created test user: ${user.id}`);

    // Create NotificationPreference (should default to: inApp=true, email=true, whatsapp=false)
    const prefs = await prisma.notificationPreference.create({
        data: {
            userId: user.id
        }
    });

    console.log('Default Preferences Created:');
    console.log(`- inAppEnabled: ${prefs.inAppEnabled} (Expected: true)`);
    console.log(`- emailEnabled: ${prefs.emailEnabled} (Expected: true)`);
    console.log(`- whatsappEnabled: ${prefs.whatsappEnabled} (Expected: false)`);
    console.log(`- timezone: ${prefs.timezone} (Expected: Asia/Kolkata)`);

    if (prefs.inAppEnabled === true && prefs.emailEnabled === true && prefs.whatsappEnabled === false) {
        console.log('✅ Success: Default preferences correctly initialized.');
    } else {
        throw new Error('❌ Failure: Default preferences incorrect.');
    }

    // Update preferences
    const updatedPrefs = await prisma.notificationPreference.update({
        where: { userId: user.id },
        data: {
            whatsappEnabled: true,
            whatsappPhone: '+919999999999',
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            timezone: 'Asia/Kolkata'
        }
    });
    console.log(`Updated WhatsApp: enabled=${updatedPrefs.whatsappEnabled}, phone=${updatedPrefs.whatsappPhone}`);
    console.log(`Updated Quiet Hours: start=${updatedPrefs.quietHoursStart}, end=${updatedPrefs.quietHoursEnd}`);

    if (updatedPrefs.whatsappEnabled && updatedPrefs.quietHoursStart === '22:00') {
        console.log('✅ Success: Preference updates persisted successfully.');
    } else {
        throw new Error('❌ Failure: Preference updates not persisted.');
    }

    // ----------------------------------------------------
    // TEST 2: Quiet Hours Calculation
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Quiet Hours Check Logic ---');
    
    // Preferences: quiet hours 22:00 to 08:00 (crosses midnight)
    const mockPrefs = {
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Kolkata'
    };

    // Test Case 2a: Simulated time inside quiet hours (e.g., 11:30 PM IST)
    // 2026-06-07T23:30:00+05:30 -> 18:00:00 UTC
    const timeInside = new Date('2026-06-07T23:30:00+05:30');
    const isInside = isInQuietHours(mockPrefs, timeInside);
    console.log(`Checking 23:30 (11:30 PM) inside quiet hours: ${isInside} (Expected: true)`);

    // Test Case 2b: Simulated time outside quiet hours (e.g., 2:00 PM IST)
    // 2026-06-07T14:00:00+05:30
    const timeOutside = new Date('2026-06-07T14:00:00+05:30');
    const isOutside = isInQuietHours(mockPrefs, timeOutside);
    console.log(`Checking 14:00 (2:00 PM) inside quiet hours: ${isOutside} (Expected: false)`);

    // Test Case 2c: Same-day quiet hours (e.g., 09:00 to 17:00)
    const sameDayPrefs = {
        quietHoursStart: '09:00',
        quietHoursEnd: '17:00',
        timezone: 'Asia/Kolkata'
    };
    const timeInsideSameDay = new Date('2026-06-07T11:00:00+05:30');
    const isInsideSameDay = isInQuietHours(sameDayPrefs, timeInsideSameDay);
    console.log(`Checking same-day 11:00 inside quiet hours 09:00-17:00: ${isInsideSameDay} (Expected: true)`);

    if (isInside === true && isOutside === false && isInsideSameDay === true) {
        console.log('✅ Success: Quiet hours check logic is 100% correct.');
    } else {
        throw new Error('❌ Failure: Quiet hours check calculation returned incorrect states.');
    }

    // ----------------------------------------------------
    // TEST 3: Daily Streak-at-Risk Warning Logic
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Streak-at-Risk Warning Sweep ---');
    
    // Finding users with active streak who haven't completed a challenge today.
    // Our test user `user` has streakCount: 4, and dailyChallengeCompletions: none (empty).
    // So our user should be caught in the sweep.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const streakAtRiskUsers = await prisma.user.findMany({
        where: {
            id: user.id,
            streakCount: { gt: 0 },
            dailyChallengeCompletions: {
                none: {
                    completedAt: { gte: todayStart }
                }
            }
        }
    });

    console.log(`Query found ${streakAtRiskUsers.length} test users at risk of losing streak.`);
    if (streakAtRiskUsers.length === 1 && streakAtRiskUsers[0].id === user.id) {
        console.log('✅ Success: Streak-at-risk sweep correctly caught the test user.');
        
        // Mock notification creation
        const notification = await prisma.notification.create({
            data: {
                userId: user.id,
                type: 'streak',
                title: '🔥 Your streak is at risk!',
                message: `Practice today to keep your ${user.streakCount}-day streak alive!`,
                category: 'warning',
                channels: ['in_app', 'whatsapp']
            }
        });
        console.log(`Created streak warning notification: ${notification.id}`);
    } else {
        throw new Error('❌ Failure: Streak-at-risk sweep did not catch the user.');
    }

    // ----------------------------------------------------
    // TEST 4: Friday League Demotion Zone Warnings
    // ----------------------------------------------------
    console.log('\n--- TEST 4: League Demotion Zone Sweeps ---');

    // Clean up any left-over leagues from previous runs
    await prisma.leagueMembership.deleteMany({ where: { league: { groupIndex: 888 } } });
    await prisma.league.deleteMany({ where: { groupIndex: 888 } });

    // Create a mock active League for this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const testLeague = await prisma.league.create({
        data: {
            tier: LeagueTier.BRONZE,
            weekStart,
            weekEnd: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000),
            groupIndex: 888,
            isActive: true
        }
    });

    // Create 12 members in this league to satisfy totalMembers > 10
    // Test user will be at rank 12 (lowest, demotion zone)
    const leagueMembers = [];
    
    // Seed 11 mock users
    for (let i = 1; i <= 11; i++) {
        const mockUser = await prisma.user.create({
            data: {
                email: `league-mock-${i}@smartcareer.com`,
                passwordHash: 'dummyhash',
                name: `Mock League Member ${i}`,
                xp: 100
            }
        });
        
        const membership = await prisma.leagueMembership.create({
            data: {
                userId: mockUser.id,
                leagueId: testLeague.id,
                weeklyXp: 150 - i * 10 // Rank 1 has 140 XP, Rank 11 has 40 XP
            }
        });
        leagueMembers.push({ user: mockUser, membership });
    }

    // Add our main test user to the league with 10 XP (Rank 12, bottom)
    const testUserMembership = await prisma.leagueMembership.create({
        data: {
            userId: user.id,
            leagueId: testLeague.id,
            weeklyXp: 10
        }
    });

    // Fetch the league and order members
    const fetchedLeague = await prisma.league.findUnique({
        where: { id: testLeague.id },
        include: {
            memberships: {
                orderBy: { weeklyXp: 'desc' }
            }
        }
    });

    if (fetchedLeague) {
        const totalMembers = fetchedLeague.memberships.length;
        console.log(`Mock League "${fetchedLeague.id}" has ${totalMembers} total members.`);
        
        // Demotion zone is bottom 5 users
        const demotionZone = fetchedLeague.memberships.slice(Math.max(0, totalMembers - 5));
        
        // Safe rank index (totalMembers - 6)
        const safeRankIndex = Math.max(0, totalMembers - 6);
        const safeWeeklyXp = fetchedLeague.memberships[safeRankIndex]?.weeklyXp || 0;

        console.log(`Safe XP boundary is at rank #${safeRankIndex + 1}: ${safeWeeklyXp} XP`);
        
        const isUserInDemotionZone = demotionZone.some(m => m.userId === user.id);
        console.log(`Is our test user in demotion zone? ${isUserInDemotionZone} (Expected: true)`);
        
        const userRank = fetchedLeague.memberships.findIndex(m => m.userId === user.id) + 1;
        const xpNeeded = Math.max(0, safeWeeklyXp - testUserMembership.weeklyXp + 10);
        console.log(`Test User rank is #${userRank}, XP needed to escape: ${xpNeeded} XP`);

        if (isUserInDemotionZone && userRank === 12 && xpNeeded === 80) {
            console.log('✅ Success: League demotion warning calculation is correct!');
        } else {
            throw new Error(`❌ Failure: League demotion sweep calculation incorrect. Got rank=${userRank}, xpNeeded=${xpNeeded}`);
        }
    }

    // Clean up league mock members
    for (const member of leagueMembers) {
        await prisma.leagueMembership.delete({ where: { id: member.membership.id } });
        await prisma.user.delete({ where: { id: member.user.id } });
    }
    await prisma.leagueMembership.delete({ where: { id: testUserMembership.id } });
    await prisma.league.delete({ where: { id: testLeague.id } });

    // ----------------------------------------------------
    // TEST 5: Email Template Compilation
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Email Template Compilation & Formatting ---');

    const skillsHtml = `
        <li><strong>JavaScript</strong>: EXPERT (80/100 XP)</li>
        <li><strong>Data Structures</strong>: INTERMEDIATE (45/100 XP)</li>
    `;

    const digestHtml = compileWeeklyDigestTemplate(
        user.name || 'Student',
        user.streakCount,
        150, // weekly XP
        3,   // challenges completed
        'Silver', // league tier
        '4', // rank
        'PROMOTED', // outcome
        skillsHtml
    );

    console.log(`Weekly Digest compiled HTML size: ${digestHtml.length} characters.`);
    if (digestHtml.includes('Hi Test Phase 3 Student') && digestHtml.includes('PROMOTED') && digestHtml.includes('Silver')) {
        console.log('✅ Success: Digest email compiles and formats data placeholders correctly.');
    } else {
        throw new Error('❌ Failure: Digest email compilation validation failed.');
    }

    // Clean up test user data
    await cleanTestData(testUserEmail);

    console.log('\n🌟 All Phase 3 test cases passed successfully!');
}

runTests()
    .catch((err) => {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
