require('dotenv').config();
const { syncProject } = require('./initial-sync');
const prisma = require('../utils/prisma');

async function run() {
    try {
        // Get slug from command line argument
        const targetSlug = process.argv[2];

        let project;
        if (targetSlug) {
            project = await prisma.project.findFirst({
                where: { slug: targetSlug }
            });
        } else {
            // Default: Find first project if no argument (or handle all - but init is heavy)
            console.log('No slug provided, finding first available project...');
            project = await prisma.project.findFirst();
        }

        if (!project) {
            console.error('Project not found');
            console.log('Usage: node engine/run-initial-sync.js <project-slug>');
            return;
        }

        console.log(`Starting sync for project ${project.name} (ID: ${project.id})`);
        await syncProject(project.id);
        console.log('Sync complete');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
