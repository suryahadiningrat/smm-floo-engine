const { Ollama } = require('ollama');

const ollama = new Ollama();

const prompt = `
You are an expert social media sentiment analyst. 
Your task is to analyze a list of comments from an Instagram post.

Context:
- Post Caption: "Telah hadir Blaze MP Tourer yang dirancang untuk melengkapi petualangan touringmu! 

Dengan profil ban yang lebih bulat, material karet sintetis yang meningkatkan grip, dan desain khusus jarak jauh, ban ini andal menemani setiap perjalanan tanpa hambatan.

Siap untuk performa maksimal? Dapatkan sekarang dan buktikan sendiri perbedaannya! 

#FreedomDefinesRide #FDRTire"
- Target Keyword: "ban"

Instructions:
For each numbered comment provided below, analyze:
1. Sentiment: Is it "positive", "negative", or "neutral"?
2. Post Relevance: Is the comment related to the content/context of the post caption? (true/false)
3. Keyword Relevance: Is the comment related to the target keyword "ban"? (true/false)

Output Format:
Return ONLY a valid JSON object. Do not include any explanation, markdown formatting, or code blocks. The JSON must follow this structure exactly:
{
  "results": [
    {
      "index": 0,
      "sentiment": "positive", 
      "is_related_to_post": true,
      "is_related_to_keyword": false
    },
    ...
  ]
}

Comments to analyze:
Sukses ❤️
`;

const test = async () => {
    try {
        
        const response = await ollama.chat({
            model: 'llama3.2',
            messages: [{ role: 'user', content: prompt }],
            format: 'json', // Enforce JSON mode if supported, or rely on prompt
            stream: false
        });

        const content = response.message.content;
        console.log('[AI Debug] Raw Content:', content);
        
        // Parse JSON
        try {
            const jsonResponse = JSON.parse(content);
            console.log(jsonResponse);
        } catch (parseError) {
            // Attempt to find JSON if wrapped in markdown code blocks
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                    try {
                    return JSON.parse(jsonMatch[1]);
                    } catch (e) {
                        // ignore
                    }
            }
            
            console.error('Failed to parse Ollama response:', content);
            throw new Error('Invalid JSON response from AI model');
        }

    } catch (error) {
        console.error('Ollama Analysis Error:', error);
        throw error;
    }
}

test()