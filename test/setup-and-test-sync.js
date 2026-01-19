require('dotenv').config();
const prisma = require('../utils/prisma');
const engine = require('../engine/initial-sync');

const BLOG_ID = '3411718';
const USER_ID = '1996313';
const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;

async function run() {
    try {
        console.log('--- Setting up Test Project ---');
        
        // 0. Ensure Plan exists
        let plan = await prisma.plan.findFirst();
        if (!plan) {
            plan = await prisma.plan.create({
                data: {
                    name: 'Free',
                    price: 0,
                    project_limit: 1
                }
            });
            console.log('Created Plan:', plan.id);
        }

        // 1. Create User (Master)
        // Check if user exists first to avoid duplicates in re-runs
        let user = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    username: 'testuser',
                    email: 'test@example.com',
                    plan_id: plan.id
                }
            });
            console.log('Created User:', user.id);
        } else {
            console.log('Using existing User:', user.id);
        }

        // 2. Create Project
        let project = await prisma.project.findFirst({
            where: { metricool_blog_id: BLOG_ID }
        });

        if (!project) {
            project = await prisma.project.create({
                data: {
                    user_id: user.id,
                    name: 'FDR Tire',
                    slug: 'fdrtire',
                    metricool_user_id: USER_ID,
                    metricool_blog_id: BLOG_ID
                }
            });
            console.log('Created Project:', project.id);
        } else {
            // Update slug if needed for testing
            if (project.slug !== 'fdrtire') {
                project = await prisma.project.update({
                    where: { id: project.id },
                    data: { slug: 'fdrtire' }
                });
                console.log('Updated Project Slug:', project.slug);
            }
            console.log('Using existing Project:', project.id);
        }

        // 3. Trigger Initial Sync
        console.log('\n--- Triggering Initial Sync ---');
        // We need to ensure engine.syncProject is exported properly and works
        await engine.syncProject(project.id);
        console.log('Initial Sync Completed');

        // 4. Verify Data
        const contentCount = await prisma.instagramContent.count({ where: { project_id: project.id } });
        const summaryCount = await prisma.instagramContentSummary.count({ where: { project_id: project.id } });
        const accountCount = await prisma.instagramAccount.count({ where: { project_id: project.id } });

        console.log('\n--- Verification Results ---');
        console.log(`InstagramContent (History): ${contentCount} rows`);
        console.log(`InstagramContentSummary (Registry): ${summaryCount} rows`);
        console.log(`InstagramAccount: ${accountCount} rows`);

    } catch (error) {
        console.error('Error during test setup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
