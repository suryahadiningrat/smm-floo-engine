const prisma = require('../utils/prisma');
const engine = require('../engine/initial-sync');

const createProject = async (req, res) => {
  try {
    const { user_id, name, slug, metricool_user_id, metricool_blog_id } = req.body;

    const project = await prisma.project.create({
      data: {
        user_id,
        name,
        slug,
        metricool_user_id,
        metricool_blog_id
      }
    });

    // Trigger Initial Data Sync (Step 3)
    if (metricool_user_id && metricool_blog_id) {
        // Call engine to sync data
        engine.syncProject(project.id);
        console.log(`[Project] Initial sync triggered for project ${project.id}`);
    }

    res.status(201).json({ status: 'success', data: project });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createProject
};
