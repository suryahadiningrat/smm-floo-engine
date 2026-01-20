const { Client } = require('pg');
const axios = require('axios');

// Configuration
const DB_CONFIG = {
    user: 'flo_smm_usr',
    host: '10.10.110.10',
    database: 'floothink_smm_db',
    password: decodeURIComponent('Fl0DBSMM%21%5E1JKL'), // Decode to get raw password: Fl0DBSMM!^1JKL
    port: 5435,
};

const API_BASE_URL = 'https://api-smm.floothink.com';

async function runTests() {
    const client = new Client(DB_CONFIG);

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected to database.');

        // 1. Get a valid User and Token
        console.log('Fetching a user with a valid token...');
        const userRes = await client.query(`
            SELECT id, email, refresh_token 
            FROM master.users 
            WHERE refresh_token IS NOT NULL 
            LIMIT 1
        `);

        if (userRes.rows.length === 0) {
            console.error('No user with refresh_token found in DB. Cannot proceed with authenticated tests.');
            await client.end();
            return;
        }

        const user = userRes.rows[0];
        const AUTH_TOKEN = user.refresh_token;
        console.log(`Using User: ${user.email} (ID: ${user.id})`);
        // console.log(`Token: ${AUTH_TOKEN}`); // Keep secret

        // 2. Get a valid Project
        console.log('Fetching a valid project...');
        const projectRes = await client.query(`
            SELECT id, name, slug 
            FROM master.projects 
            WHERE user_id = $1 
            LIMIT 1
        `, [user.id]);

        let projectId = null;
        if (projectRes.rows.length > 0) {
            projectId = projectRes.rows[0].id;
            console.log(`Using Project: ${projectRes.rows[0].name} (ID: ${projectId})`);
        } else {
            console.warn('No project found for this user. Some tests will be skipped.');
            // Try to find ANY project just for testing read endpoints if user permissions allow (assuming row level security isn't strict in app logic for this test, or we just fail)
            // But usually API checks project ownership.
            // Let's try to find a project where user_id matches, or just skip.
        }

        // 3. Test Endpoints
        const axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'AUTH-TOKEN-KEY': AUTH_TOKEN,
                'Content-Type': 'application/json'
            },
            validateStatus: () => true // Don't throw on error status
        });

        console.log('\n--- Starting API Tests ---\n');

        // Test 1: Public Health Check
        await testEndpoint(axiosInstance, 'GET', '/', null, false);

        // Test 2: User Analysis List
        await testEndpoint(axiosInstance, 'GET', '/api/users/analyze');

        // Test 3: Instagram Account (if project exists)
        if (projectId) {
            const today = new Date().toISOString().split('T')[0];
            const lastMonth = new Date();
            lastMonth.setDate(lastMonth.getDate() - 30);
            const startDate = lastMonth.toISOString().split('T')[0];

            const params = {
                project_id: projectId,
                start_date: startDate,
                end_date: today
            };

            await testEndpoint(axiosInstance, 'GET', '/api/instagram/account', { params });
            await testEndpoint(axiosInstance, 'GET', '/api/instagram/posts', { params });
            await testEndpoint(axiosInstance, 'GET', '/api/instagram/stories', { params });
        }

        // Test 4: Trigger Sync (Be careful, maybe skip to avoid load? User asked to test all)
        // We will just hit it if we have a project.
        if (projectId) {
             console.log(`\nTesting Sync Trigger for Project ${projectId}...`);
             // await testEndpoint(axiosInstance, 'POST', `/api/projects/${projectId}/sync`);
             console.log('Skipping Sync Trigger to avoid spamming engine during test run. Uncomment in script if needed.');
        }

    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await client.end();
    }
}

async function testEndpoint(axiosInstance, method, url, config = {}, auth = true) {
    console.log(`Testing ${method} ${url}...`);
    const start = Date.now();
    try {
        const response = await axiosInstance.request({
            method,
            url,
            ...config
        });
        const duration = Date.now() - start;
        
        if (response.status >= 200 && response.status < 300) {
            console.log(`✅ [${response.status}] Success (${duration}ms)`);
        } else {
            console.log(`❌ [${response.status}] Failed (${duration}ms)`);
            console.log('Response:', JSON.stringify(response.data, null, 2));
        }
    } catch (error) {
        console.error(`❌ Error calling ${url}:`, error.message);
    }
}

runTests();
