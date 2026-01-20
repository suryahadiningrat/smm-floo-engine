const { Ollama } = require('ollama');
const fs = require('fs');

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' });

/**
 * Analyze a batch of comments
 */
const analyzeBatch = async (caption, keyword, commentsBatch, startIndex) => {
    const commentsText = commentsBatch.map((c, index) => `[ID:${startIndex + index}] ${c.text}`).join('\n');

    const systemPrompt = `You are a strict API that analyzes social media comments.
Output must be a JSON object with a "results" array.
Do not output any markdown, explanations, or conversational text.
Only output the JSON.`;

    const userPrompt = `
Task: Analyze the following comments for sentiment and relevance.

Context:
- Post Caption: "${caption}"
- Target Keyword: "${keyword}"

Schema required:
{
  "results": [
    {
      "index": number, // The ID provided in the input (e.g., ID:5 -> 5)
      "sentiment": "positive" | "negative" | "neutral",
      "is_related_to_post": boolean,
      "is_related_to_keyword": boolean
    }
  ]
}

Comments to analyze:
${commentsText}
`;

    try {
        const response = await ollama.chat({
            model: 'llama3.2',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            format: 'json',
            stream: false,
            options: {
                temperature: 0.1 // Low temperature for deterministic output
            }
        });

        const content = response.message.content;
        
        // Try parsing
        try {
            // Remove any potential markdown wrappers if the model ignores strict JSON mode
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const json = JSON.parse(cleanContent);
            return json.results || [];
        } catch (e) {
            console.warn(`[AI Service] Failed to parse batch starting at ${startIndex}. Content: ${content.substring(0, 100)}...`);
            return [];
        }

    } catch (error) {
        console.error(`[AI Service] Error processing batch starting at ${startIndex}:`, error.message);
        return [];
    }
};

/**
 * Analyze comments using Ollama (Llama 3.2)
 * Handles batching to avoid context limits and hallucinations.
 * @param {string} caption - The post caption for context
 * @param {string} keyword - The user-provided keyword
 * @param {Array} comments - Array of comment objects { username, text }
 * @returns {Promise<Object>} - Raw analysis results
 */
const analyzeSentiment = async (caption, keyword, comments) => {
    if (!comments || comments.length === 0) {
        return { results: [] };
    }

    const BATCH_SIZE = 10; // Process 10 comments at a time for reliability
    const allResults = [];
    
    console.log(`[AI Service] Starting analysis for ${comments.length} comments...`);

    for (let i = 0; i < comments.length; i += BATCH_SIZE) {
        const batch = comments.slice(i, i + BATCH_SIZE);
        console.log(`[AI Service] Processing batch ${i} - ${i + batch.length}...`);
        
        const batchResults = await analyzeBatch(caption, keyword, batch, i);
        
        if (batchResults && Array.isArray(batchResults)) {
            allResults.push(...batchResults);
        }
    }

    console.log(`[AI Service] Analysis complete. Total results: ${allResults.length}`);

    return { results: allResults };
};

/**
 * Extract text/numbers from a barcode image using Llama Vision
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - Extracted numbers
 */
const readBarcode = async (imagePath) => {
    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image not found at ${imagePath}`);
        }

        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        const response = await ollama.chat({
            model: 'llama3.2-vision', // Requires a vision-capable model
            messages: [
                {
                    role: 'user',
                    content: 'Please look at this barcode image. Extract all the numbers you see below or inside the barcode. Return ONLY the numbers as a plain string, no spaces, no text.',
                    images: [base64Image]
                }
            ],
            stream: true
        });

        let fullContent = '';
        for await (const part of response) {
            fullContent += part.message.content;
        }

        return fullContent.trim();
    } catch (error) {
        console.error('[AI Service] Barcode reading failed:', error.message);
        if (error.cause) {
            console.error('[AI Service] Cause:', error.cause);
        }
        throw error;
    }
};

module.exports = {
    analyzeSentiment,
    readBarcode
};

