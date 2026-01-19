
const prisma = require('./utils/prisma');

async function main() {
    const project = await prisma.project.findFirst();
    console.log(project);
}

main();
