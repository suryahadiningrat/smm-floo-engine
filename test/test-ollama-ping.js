const { Ollama } = require('ollama');

// Use the host configured in docker-compose, or default to localhost for local testing
// In Docker, this should be http://host.docker.internal:11434
const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

console.log(`Target Ollama Host: ${host}`);

const ollama = new Ollama({ host });

(async () => {
    try {
        console.log('Pinging Ollama...');
        // List models is a lightweight way to check connection and see what's available
        const list = await ollama.list();
        
        console.log('✅ Connection Successful!');
        console.log('Available Models on Host:');
        list.models.forEach(m => {
            console.log(` - ${m.name} (Size: ${(m.size / 1024 / 1024 / 1024).toFixed(2)} GB)`);
        });

        // Verify if our target model exists
        const targetModel = process.env.OLLAMA_MODEL || 'llama4';
        const exists = list.models.some(m => m.name.includes(targetModel) || m.name === targetModel);
        
        if (exists) {
             console.log(`✅ Target model '${targetModel}' found!`);
        } else {
             console.warn(`⚠️ Target model '${targetModel}' NOT found in list. It might need to be pulled on the host.`);
             console.log(`   Run 'ollama pull ${targetModel}' in your Windows PowerShell.`);
        }

    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error('Error:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
        
        console.log('\nTroubleshooting:');
        console.log('1. Ensure Ollama app is running on Windows.');
        console.log('2. Ensure OLLAMA_HOST env var is set to 0.0.0.0 on Windows.');
        console.log('3. If running inside Docker, ensure OLLAMA_HOST is http://host.docker.internal:11434');
    }
})();