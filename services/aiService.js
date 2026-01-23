const { Ollama } = require('ollama');
const fs = require('fs');

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' });

const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama4';
const DEFAULT_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'llama4';

console.log(`[AI Service] Configured OLLAMA_HOST: ${process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'}`);
console.log(`[AI Service] Configured Default Model: ${DEFAULT_MODEL}`);

/**
 * Analyze a batch of comments
 */
const analyzeBatch = async (caption, keyword, commentsBatch, startIndex) => {
    const commentsText = commentsBatch.map((c, index) => `[ID:${startIndex + index}] ${c.text}`).join('\n');

    const systemPrompt = `You are an expert Brand Reputation Analyst for Instagram comments.
Your goal is to categorize comments based on their impact on the Brand's image using Indonesian context and slang.

DEFINITIONS:
1. POSITIVE: Comments that EXPLICITLY praise the Brand, Product, or Service.
   - Direct compliments (e.g., "Ban FDR enak banget", "Admin ramah", "Produk terbaik").
   - Expressing love/loyalty to the brand.
   - Thanking the brand for a specific benefit/prize.
   - *NOTE: Merely answering a quiz or telling a story is NOT positive.*

2. NEGATIVE: Comments that damage the brand image.
   - Mockery, insults, sarcasm, or hate speech.
   - Complaints about product quality or service.
   - Scam accusations or dissatisfaction.

3. NEUTRAL: General engagement that is neither praise nor attack.
   - Contest entries, answers to quizzes, or sharing personal stories (e.g., "Ritual saya sebelum riding adalah...", "Jawabannya A").
   - Hope to win (e.g., "Semoga menang", "Wish me luck", "Bismillah").
   - Participation (e.g., "Ikutan min", "Done rules").
   - Tagging friends.
   - Questions (e.g., "Harganya berapa?").
   - "Semoga berkah" or general well-wishes that don't praise the product.

IMPORTANT RULES:
- **STRICT POSITIVE**: Do NOT label a comment as POSITIVE just because it is long or polite. It MUST praise the brand/product.
- **CONTEXT MATTERS**: "Ritual unik saya..." is NEUTRAL (it's a story). "Ritual unik saya pakai FDR karena awet" is POSITIVE (praises product).
- Understand Indonesian slang.
- IS_RELATED_TO_POST: True if the comment answers the prompt or discusses the content.
- IS_RELATED_TO_KEYWORD: True ONLY if the keyword "${keyword}" is EXPLICITLY mentioned.
- Output strictly in JSON format with a "results" array. No markdown.`;

    const userPrompt = `
Task: Analyze the following comments.

Context:
- Post Caption: "${caption}"
- Target Keyword: "${keyword}"

Schema required:
{
  "results": [
    {
      "index": number,
      "sentiment": "positive" | "negative" | "neutral",
      "is_related_to_post": boolean, // True if discusses the content/caption/brand
      "is_related_to_keyword": boolean // True if contains keyword or close variant
    }
  ]
}

Comments to analyze:
${commentsText}
`;

    try {
        const response = await ollama.chat({
            model: DEFAULT_MODEL, // Default to llama4 for better reasoning
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
            
            // Fix Indices: Trust the array order, not the model's hallucinated indices
            // The model might return indices 0,1,2,3,4 even if we asked for 5,6,7,8,9
            // Or it might return random indices.
            // Assumption: Model preserves order of input comments.
            if (json.results && Array.isArray(json.results)) {
                return json.results.map((r, i) => ({
                    ...r,
                    index: startIndex + i // Force the correct global index
                }));
            }
            
            return [];
        } catch (e) {
            console.warn(`[AI Service] Failed to parse batch starting at ${startIndex}. Content: ${content.substring(0, 100)}...`);
            return [];
        }

    } catch (error) {
        console.error(`[AI Service] Error processing batch starting at ${startIndex}:`, error.message);
        throw error; // Rethrow to trigger retry logic in parent function
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

    const BATCH_SIZE = 5; // Reduced from 10 to 5 to prevent "fetch failed" / timeouts
    const allResults = [];
    
    console.log(`[AI Service] Starting analysis for ${comments.length} comments...`);

    for (let i = 0; i < comments.length; i += BATCH_SIZE) {
        const batch = comments.slice(i, i + BATCH_SIZE);
        console.log(`[AI Service] Processing batch ${i} - ${i + batch.length}...`);
        
        let attempts = 0;
        let success = false;
        
        while (attempts < 3 && !success) {
            try {
                const batchResults = await analyzeBatch(caption, keyword, batch, i);
                if (batchResults && Array.isArray(batchResults)) {
                    allResults.push(...batchResults);
                }
                success = true;
            } catch (err) {
                attempts++;
                console.warn(`[AI Service] Batch ${i} failed (Attempt ${attempts}/3). Retrying in 2s...`);
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        if (!success) {
            console.error(`[AI Service] Batch ${i} failed after 3 attempts. Skipping.`);
        }

        // Add a small delay between batches to let Ollama breathe
        await new Promise(resolve => setTimeout(resolve, 1000));
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
            model: DEFAULT_VISION_MODEL, // Use env var or fallback
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

/**
 * Warmup the AI model to prevent cold start timeouts
 */
const warmup = async () => {
    console.log(`[AI Service] Warming up model: ${DEFAULT_MODEL}...`);
    try {
        // Fire and forget, or wait? Better wait to ensure readiness logs appear.
        // Use a very short timeout or simple prompt.
        await ollama.chat({
            model: DEFAULT_MODEL,
            messages: [{ role: 'user', content: 'hi' }],
            options: { num_predict: 1 } // Generate minimal tokens
        });
        console.log(`[AI Service] Model ${DEFAULT_MODEL} is ready!`);
    } catch (error) {
        console.warn(`[AI Service] Warmup failed for ${DEFAULT_MODEL}:`, error.message);
        console.warn('[AI Service] This is expected if Ollama is just starting up. Retries will handle requests.');
    }
};

module.exports = {
    analyzeSentiment,
    readBarcode,
    warmup
};

