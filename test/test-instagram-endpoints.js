const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

const testEndpoints = async () => {
    console.log('Testing Instagram Endpoints...');

    const endpoints = [
        '/instagram/posts',
        '/instagram/reels',
        '/instagram/stories'
    ];

    const params = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        project_id: 1 // Assuming project 1 exists
    };

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint}...`);
            // 1. Test with valid params
            const response = await axios.get(`${BASE_URL}${endpoint}`, { params });
            console.log(`✅ ${endpoint} Success: Status ${response.status}`);
            
            if (response.data.length > 0) {
                const item = response.data[0];
                console.log(`   Sample keys: ${Object.keys(item).join(', ')}`);
                // Basic structure check
                if (!item.id || !item.media_url) {
                    console.warn(`   ⚠️ Warning: Unexpected structure in ${endpoint}`);
                }
            } else {
                console.log(`   ℹ️ No data returned (expected if DB empty)`);
            }

            // 2. Test missing params
            try {
                await axios.get(`${BASE_URL}${endpoint}`, { params: { project_id: 1 } });
                console.error(`❌ ${endpoint} Failed: Should have returned 400 for missing dates`);
            } catch (err) {
                if (err.response && err.response.status === 400) {
                    console.log(`✅ ${endpoint} Correctly validated missing params (400)`);
                } else {
                    console.error(`❌ ${endpoint} Unexpected error for missing params: ${err.message}`);
                }
            }

        } catch (error) {
            console.error(`❌ ${endpoint} Error:`, error.message);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Data:`, error.response.data);
            }
        }
    }
};

testEndpoints();
