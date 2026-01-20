const aiService = require('../services/aiService');
const path = require('path');
const fs = require('fs');

const runTest = async () => {
    // 1. Get image path from arguments or default
    const args = process.argv.slice(2);
    let imagePath = args[0];

    if (!imagePath) {
        // Default test file
        imagePath = path.join(__dirname, 'fixtures', 'barcode.jpg');
        console.log('No image path provided. Using default:', imagePath);
    }

    // 2. Resolve absolute path
    if (!path.isAbsolute(imagePath)) {
        imagePath = path.resolve(process.cwd(), imagePath);
    }

    console.log(`\n--- Testing Barcode Reading with Llama ---`);
    console.log(`Target Image: ${imagePath}`);

    // 3. Check if file exists
    if (!fs.existsSync(imagePath)) {
        console.error(`\n[ERROR] File not found!`);
        console.log(`Usage: node test/test-barcode.js <path-to-image>`);
        console.log(`Example: node test/test-barcode.js ./my-barcode.jpg`);
        console.log(`\nPlease save your barcode image to 'test/fixtures/barcode.jpg' or provide a path.`);
        process.exit(1);
    }

    try {
        console.log('Sending to Llama 3.2 Vision...');
        const startTime = Date.now();
        
        const result = await aiService.readBarcode(imagePath);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n--- Result ---');
        console.log(`Time taken: ${duration}s`);
        console.log(`Extracted Numbers: "${result}"`);
        console.log('----------------');

    } catch (error) {
        console.error('\n[FAILED] Error during analysis:');
        if (error.message.includes('model')) {
            console.error('It seems you might be missing the vision model.');
            console.error('Try running: ollama pull llama3.2-vision');
        } else {
            console.error(error.message);
        }
    }
};

runTest();
