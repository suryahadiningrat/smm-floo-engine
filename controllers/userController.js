const prisma = require('../utils/prisma');

const createUser = async (req, res) => {
  try {
    const { email, username, plan_id } = req.body;
    
    // Check if plan exists, if not create default
    let planId = plan_id;
    if (!planId) {
      const defaultPlan = await prisma.plan.findFirst({
        where: { name: 'Free' }
      });
      if (defaultPlan) {
        planId = defaultPlan.id;
      } else {
        // Create default plan
        const newPlan = await prisma.plan.create({
          data: {
            name: 'Free',
            price: 0,
            project_limit: 1
          }
        });
        planId = newPlan.id;
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
        plan_id: planId
      }
    });

    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createUser
};
