require('dotenv').config();
const { syncProject } = require('./initial-sync');
const prisma = require('../utils/prisma');

async function run() {
    try {
        // Get project ID (assuming ID 1 or find by name)
        const project = await prisma.project.findFirst({
            where: { slug: 'fdrtire' } // Adjust if needed
        });

        if (!project) {
            console.error('Project not found');
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
