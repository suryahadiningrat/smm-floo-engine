const prisma = require('../utils/prisma');
const { createNotification } = require('../services/notificationService');

async function test() {
    console.log('--- Testing Notification System ---');

    try {
        // 1. Find a user to test with
        console.log('1. Finding a user...');
        const user = await prisma.user.findFirst();
        
        if (!user) {
            console.log('No user found. Creating a test user...');
            // Need a plan first
            let plan = await prisma.plan.findFirst();
            if (!plan) {
                 plan = await prisma.plan.create({
                    data: { name: 'Free', price: 0, project_limit: 1 }
                 });
            }
            // Create user
             await prisma.user.create({
                data: {
                    email: 'test_notif@example.com',
                    username: 'test_notif',
                    plan_id: plan.id
                }
            });
            // Fetch again
             const user = await prisma.user.findFirst({ where: { email: 'test_notif@example.com' } });
             if(!user) throw new Error('Failed to create user');
        }
        console.log(`Found user: ${user.id} (${user.email})`);

        // 2. Create a notification
        console.log('2. Creating a test notification...');
        const message = `Test notification at ${new Date().toISOString()}`;
        await createNotification(user.id, message);

        // 3. Verify it exists in DB
        console.log('3. Verifying notification in DB...');
        const notification = await prisma.notification.findFirst({
            where: {
                user_id: user.id,
                message: message
            },
            orderBy: { created_at: 'desc' }
        });

        if (notification) {
            console.log('SUCCESS: Notification found in DB!');
            console.log(notification);
        } else {
            console.error('FAILURE: Notification NOT found in DB.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
