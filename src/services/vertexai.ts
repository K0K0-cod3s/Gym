import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const API_KEY = 'AIzaSyBJxeLxwnH08rK1V0gyt-rx5rNwhGXHPZs';
const genAI = new GoogleGenerativeAI(API_KEY);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const callGemini = async (prompt: string, schema?: any): Promise<string> => {
  console.log('🤖 Calling Gemini API...');
  console.log('📝 Prompt length:', prompt.length);
  
  const maxRetries = 3;
  let lastError: Error = new Error('Unknown error occurred during API call');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
        await sleep(delay);
      }

      // Get the generative model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      console.log(`📤 Making API request (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      // Add schema instruction to prompt if provided
      let finalPrompt = prompt;
      if (schema) {
        finalPrompt += `\n\nPlease respond with valid JSON that matches this schema: ${JSON.stringify(schema)}`;
      }

      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      
      console.log('📥 Response received');

      if (response.text) {
        const responseText = response.text();
        console.log('✅ Generated text length:', responseText.length);
        console.log('📄 Generated text preview:', responseText.substring(0, 200) + '...');
        return responseText;
      } else {
        console.error('❌ No text in response:', response);
        throw new Error("Failed to get a valid response from Gemini.");
      }
    } catch (error) {
      console.error(`❌ Gemini API call error (attempt ${attempt + 1}):`, error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = new Error('Network error: Unable to reach Gemini API. Please check your internet connection.');
        
        // For network errors, also retry
        if (attempt < maxRetries) {
          console.log('🔄 Network error, will retry...');
          continue;
        }
      } else if (error instanceof Error) {
        // Check for specific Gemini API errors
        if (error.message.includes('API_KEY')) {
          lastError = new Error('Invalid API key. Please check your Gemini API configuration.');
        } else if (error.message.includes('quota')) {
          lastError = new Error('API quota exceeded. Please try again later.');
        } else if (error.message.includes('blocked')) {
          lastError = new Error('Content was blocked by safety filters. Please try a different prompt.');
        } else {
          lastError = error;
        }
      } else {
        lastError = new Error('Unknown error occurred during API call');
      }
      
      // If this is the last attempt or a non-retryable error, throw
      if (attempt === maxRetries || 
          (lastError.message.includes('API key') || 
           lastError.message.includes('blocked'))) {
        throw lastError;
      }
    }
  }

  // This should never be reached, but just in case
  throw lastError;
};