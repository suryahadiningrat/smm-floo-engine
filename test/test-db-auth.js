const axios = require('axios');
const prisma = require('../utils/prisma');

const BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'test-token-' + Date.now();
const TEST_EMAIL = `test-${Date.now()}@example.com`;

async function runTest() {
    console.log('--- Starting Database Auth Test ---');

    let createdUser = null;
    let createdPlan = null;

    try {
        // 1. Setup: Create a Plan and User with Token
        console.log('1. Setting up test data...');
        
        // Ensure at least one plan exists
        createdPlan = await prisma.plan.findFirst();
        if (!createdPlan) {
            createdPlan = await prisma.plan.create({
                data: {
                    name: 'Test Plan',
                    price: 0,
                    project_limit: 1
                }
            });
            console.log('   Created Test Plan:', createdPlan.id);
        }

        createdUser = await prisma.user.create({
            data: {
                email: TEST_EMAIL,
                username: 'testuser',
                plan_id: createdPlan.id,
                refresh_token: TEST_TOKEN
            }
        });
        console.log(`   Created User with Token: ${TEST_TOKEN}`);

        // 2. Test Valid Token
        console.log('\n2. Testing Valid Token...');
        try {
            const response = await axios.get(`${BASE_URL}/api/users/analyze`, {
                headers: {
                    'AUTH-TOKEN-KEY': TEST_TOKEN
                }
            });
            console.log(`   [PASS] Status: ${response.status}`);
        } catch (error) {
            console.error(`   [FAIL] Valid token request failed: ${error.message}`);
            if (error.response) console.error('   Response:', error.response.data);
        }

        // 3. Test Invalid Token
        console.log('\n3. Testing Invalid Token...');
        try {
            await axios.get(`${BASE_URL}/api/users/analyze`, {
                headers: {
                    'AUTH-TOKEN-KEY': 'invalid-token-123'
                }
            });
            console.error('   [FAIL] Invalid token request succeeded (should have failed)');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('   [PASS] Got 401 Unauthorized as expected');
            } else {
                console.error(`   [FAIL] Unexpected error: ${error.message}`);
            }
        }

        // 4. Test Missing Token
        console.log('\n4. Testing Missing Token...');
        try {
            await axios.get(`${BASE_URL}/api/users/analyze`);
            console.error('   [FAIL] Missing token request succeeded (should have failed)');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('   [PASS] Got 401 Unauthorized as expected');
            } else {
                console.error(`   [FAIL] Unexpected error: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('Test Execution Error:', error);
    } finally {
        // Cleanup
        if (createdUser) {
            console.log('\nCleaning up...');
            await prisma.user.delete({ where: { id: createdUser.id } });
            console.log('Test User deleted.');
        }
        await prisma.$disconnect();
    }
}

runTest();
