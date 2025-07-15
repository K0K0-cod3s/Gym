// import { GoogleGenerativeAI } from '@google/generative-ai';
//
// // Initialize Gemini API
// const API_KEY = 'AIzaSyBJxeLxwnH08rK1V0gyt-rx5rNwhGXHPZs'; // Replace with your actual API key
// const genAI = new GoogleGenerativeAI(API_KEY);
//
// const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
//
// export const callGemini = async (prompt: string, schema?: any): Promise<string> => {
//   console.log('🤖 Calling Gemini API...');
//   console.log('📝 Prompt length:', prompt.length);
//
//   const maxRetries = 3;
//   let lastError: Error = new Error('Unknown error occurred during API call');
//
//   for (let attempt = 0; attempt <= maxRetries; attempt++) {
//     try {
//       if (attempt > 0) {
//         const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
//         console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
//         await sleep(delay);
//       }
//
//       // Get the generative model
//       const model = genAI.getGenerativeModel({
//         model: "gemini-1.5-flash",
//         generationConfig: {
//           temperature: 0.7,
//           topK: 40,
//           topP: 0.95,
//           maxOutputTokens: 2048,
//         }
//       });
//
//       console.log(`📤 Making API request (attempt ${attempt + 1}/${maxRetries + 1})`);
//
//       // Add schema instruction to prompt if provided
//       let finalPrompt = prompt;
//       if (schema) {
//         finalPrompt += `\n\nPlease respond with valid JSON that matches this schema: ${JSON.stringify(schema)}`;
//       }
//
//       const result = await model.generateContent(finalPrompt);
//       const response = await result.response;
//
//       console.log('📥 Response received');
//
//       if (response.text) {
//         const responseText = response.text();
//         console.log('✅ Generated text length:', responseText.length);
//         console.log('📄 Generated text preview:', responseText.substring(0, 200) + '...');
//         return responseText;
//       } else {
//         console.error('❌ No text in response:', response);
//         throw new Error("Failed to get a valid response from Gemini.");
//       }
//     } catch (error) {
//       console.error(`❌ Gemini API call error (attempt ${attempt + 1}):`, error);
//
//       // Check if it's a network error
//       if (error instanceof TypeError && error.message.includes('fetch')) {
//         lastError = new Error('Network error: Unable to reach Gemini API. Please check your internet connection.');
//
//         // For network errors, also retry
//         if (attempt < maxRetries) {
//           console.log('🔄 Network error, will retry...');
//           continue;
//         }
//       } else if (error instanceof Error) {
//         // Check for specific Gemini API errors
//         if (error.message.includes('API_KEY')) {
//           lastError = new Error('Invalid API key. Please check your Gemini API configuration.');
//         } else if (error.message.includes('quota')) {
//           lastError = new Error('API quota exceeded. Please try again later.');
//         } else if (error.message.includes('blocked')) {
//           lastError = new Error('Content was blocked by safety filters. Please try a different prompt.');
//         } else {
//           lastError = error;
//         }
//       } else {
//         lastError = new Error('Unknown error occurred during API call');
//       }
//
//       // If this is the last attempt or a non-retryable error, throw
//       if (attempt === maxRetries ||
//           (lastError.message.includes('API key') ||
//            lastError.message.includes('blocked'))) {
//         throw lastError;
//       }
//     }
//   }
//
//   // This should never be reached, but just in case
//   throw lastError;
// };

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const API_KEY = "AIzaSyCTjm2_op-C171gatkWLianfc0-8uX2a4A"!;
const genAI = new GoogleGenerativeAI(API_KEY);

// Utility: Sleep for delay (ms)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Determine if the error is retryable
const isRetryableError = (error: any) => {
  return (
      (error instanceof TypeError && error.message.includes('fetch')) ||
      error.message?.includes('503') ||
      error.status === 503
  );
};

export const callGemini = async (prompt: string, schema?: any): Promise<string> => {
  console.log('🤖 Calling Gemini API...');
  console.log('📝 Prompt length:', prompt.length);

  const maxRetries = 3;
  let lastError: Error = new Error('Unknown error occurred during API call');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
        await sleep(delay);
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      console.log(`📤 Making API request (attempt ${attempt + 1}/${maxRetries + 1})`);

      // Append schema instructions to prompt if needed
      let finalPrompt = prompt;
      if (schema) {
        finalPrompt += `\n\nPlease respond with valid JSON that matches this schema: ${JSON.stringify(schema)}`;
      }

      const result = await model.generateContent(finalPrompt);
      const response = result.response;

      console.log('📥 Response received');

      const responseText = await response.text();
      console.log('✅ Generated text length:', responseText.length);
      console.log('📄 Generated text preview:', responseText.substring(0, 200) + '...');
      return responseText;

    } catch (error: any) {
      console.error(`❌ Gemini API call error (attempt ${attempt + 1}):`, error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = new Error('Network error: Unable to reach Gemini API. Please check your internet connection.');
      } else if (error.message?.includes('API_KEY')) {
        lastError = new Error('Invalid API key. Please check your Gemini API configuration.');
      } else if (error.message?.includes('quota')) {
        lastError = new Error('API quota exceeded. Please try again later.');
      } else if (error.message?.includes('blocked')) {
        lastError = new Error('Content was blocked by safety filters. Please try a different prompt.');
      } else if (error.message?.includes('503') || error.status === 503) {
        lastError = new Error('Gemini API is overloaded (503). Please try again later.');
      } else {
        lastError = error;
      }

      if (attempt === maxRetries || !isRetryableError(error)) {
        throw lastError;
      }

      console.log('🔄 Retryable error, will retry...');
    }
  }

  throw lastError; // Should never reach here
};
