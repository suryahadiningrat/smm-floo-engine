const { Ollama } = require('ollama');

const testConnection = async () => {
    const ollama = new Ollama();
    try {
        console.log('Testing Ollama connection...');
        const response = await ollama.list();
        console.log('Ollama is reachable.');
        console.log('Available models:', response.models.map(m => m.name));
    } catch (error) {
        console.error('Ollama connection failed:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
    }
};

testConnection();