import { generateImage, DalleRequest } from '../src/dalle'; // Adjust path if needed. DalleResponse was unused.
import axios from 'axios'; // Import to potentially check isAxiosError if needed, but not for mocking

const describeIfApiKey = process.env.OPENAI_API_KEY ? describe : describe.skip;

describeIfApiKey('generateImage - Integration Tests (Live API)', () => {
  const apiKey = process.env.OPENAI_API_KEY!; // Assert non-null as tests are skipped otherwise

  // Increase Jest timeout for API calls
  jest.setTimeout(30000); // 30 seconds

  it('should successfully generate an image with DALL-E 3', async () => {
    const params: DalleRequest = {
      prompt: 'A photorealistic image of a futuristic cityscape at dusk',
      model: 'dall-e-3',
      n: 1,
      size: '1024x1024',
      quality: 'standard', // 'hd' can be slower and more expensive
      response_format: 'url',
    };

    try {
      const response = await generateImage(apiKey, params);
      expect(response).toBeDefined();
      expect(response.created).toBeGreaterThan(0);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBe(1);
      expect(response.data[0].url).toBeDefined();
      expect(response.data[0].url).toMatch(
        /^https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net/
      );
      // revised_prompt is common with DALL-E 3
      expect(response.data[0].revised_prompt).toBeDefined();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          'DALL-E API Error (dall-e-3 test):',
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error; // Re-throw to fail the test
    }
  });

  it('should successfully generate an image with DALL-E 2', async () => {
    const params: DalleRequest = {
      prompt: 'A simple cartoon of a happy cloud',
      model: 'dall-e-2',
      n: 1,
      size: '256x256', // Smallest size for speed and cost
      response_format: 'url',
    };

    try {
      const response = await generateImage(apiKey, params);
      expect(response).toBeDefined();
      expect(response.created).toBeGreaterThan(0);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBe(1);
      expect(response.data[0].url).toBeDefined();
      expect(response.data[0].url).toMatch(
        /^https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net/
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          'DALL-E API Error (dall-e-2 test):',
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error; // Re-throw to fail the test
    }
  });

  it('should return b64_json if requested', async () => {
    const params: DalleRequest = {
      prompt: 'A pencil sketch of a flower',
      model: 'dall-e-2',
      n: 1,
      size: '256x256',
      response_format: 'b64_json',
    };
    try {
      const response = await generateImage(apiKey, params);
      expect(response).toBeDefined();
      expect(response.data[0].b64_json).toBeDefined();
      expect(response.data[0].b64_json?.length).toBeGreaterThan(100); // Arbitrary check for non-empty string
      expect(response.data[0].url).toBeUndefined(); // Ensure URL is not present
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          'DALL-E API Error (b64_json test):',
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error;
    }
  });
});
