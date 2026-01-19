
const { PrismaClient } = require('@prisma/client');
const prisma = require('../utils/prisma');

const run = async () => {
    const project = await prisma.project.findFirst();
    if (!project) {
        console.log('No project found');
        return;
    }
    console.log(`Using Project ID: ${project.id} (${project.name})`);

    const shortcodes = [
        'DTh2lMkDuOX',
        'DTaBfX0CbF7',
        'DS4i9MKjuwY',
        'DTPuKKmjiZ9',
        'DSt7DeXCTkq',
        'DK3plhah3z0'
    ];

    console.log(`Checking ${shortcodes.length} shortcodes in Project ${project.id}...`);

    for (const code of shortcodes) {
        const exists = await prisma.instagramContentSummary.findFirst({
            where: {
                project_id: project.id,
                content_id: code
            }
        });
        
        if (exists) {
            console.log(`[FOUND] ${code} (ID: ${exists.id})`);
        } else {
            // Check raw content
            const raw = await prisma.instagramContent.findFirst({
                where: {
                    project_id: project.id,
                    content_id: code
                }
            });
            if (raw) {
                console.log(`[FOUND RAW ONLY] ${code} (ID: ${raw.id})`);
            } else {
                console.log(`[MISSING] ${code}`);
            }
        }
    }
};

run();
