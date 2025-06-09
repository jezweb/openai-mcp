import axios from 'axios';
import { generateImage, DalleRequest, DalleResponse } from '../src/dalle'; // Adjust path if needed

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('generateImage', () => {
  const apiKey = 'test-api-key';

  beforeEach(() => {
    mockedAxios.post.mockReset();
  });

  it('should call OpenAI API with correct parameters for DALL-E 3 (default)', async () => {
    const params: DalleRequest = { prompt: 'A cat' };
    const mockResponseData: DalleResponse = {
      created: Date.now(),
      data: [
        { url: 'http://example.com/image.png', revised_prompt: 'A cool cat' },
      ],
    };
    mockedAxios.post.mockResolvedValue({ data: mockResponseData });

    await generateImage(apiKey, params);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.openai.com/v1/images/generations',
      {
        prompt: 'A cat',
        model: 'dall-e-3', // Default
        n: 1, // Default for DALL-E 3
        size: '1024x1024', // Default
        quality: 'standard', // Default
        style: 'vivid', // Default
        response_format: 'url', // Default
        user: undefined,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
  });

  it('should call OpenAI API with correct parameters for DALL-E 2 and n=2', async () => {
    const params: DalleRequest = {
      prompt: 'Two dogs',
      model: 'dall-e-2',
      n: 2,
      size: '512x512',
    };
    const mockResponseData: DalleResponse = {
      created: Date.now(),
      data: [{ url: 'url1' }, { url: 'url2' }],
    };
    mockedAxios.post.mockResolvedValue({ data: mockResponseData });

    await generateImage(apiKey, params);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        prompt: 'Two dogs',
        model: 'dall-e-2',
        n: 2,
        size: '512x512',
      }),
      expect.any(Object)
    );
  });

  it('should throw error if n > 1 for DALL-E 3', async () => {
    const params: DalleRequest = { prompt: 'A house', model: 'dall-e-3', n: 2 };
    // Using a try-catch block to assert the error message and ensure no API call was made.
    try {
      await generateImage(apiKey, params);
    } catch (e: unknown) {
      expect(e instanceof Error ? e.message : String(e)).toBe(
        'DALL-E 3 only supports generating 1 image at a time (n=1).'
      );
    }
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should correctly pass all specified parameters with DALL-E 3 (n=1)', async () => {
    const params: DalleRequest = {
      prompt: 'A detailed scene',
      model: 'dall-e-3',
      n: 1, // n is correctly 1 for DALL-E 3
      size: '1792x1024',
      quality: 'hd',
      style: 'natural',
      response_format: 'b64_json',
      user: 'testUser',
    };
    // Expected payload is identical to params when n is correctly set for DALL-E 3
    const mockResponseData: DalleResponse = {
      created: Date.now(),
      data: [{ b64_json: 'base64data' }],
    };
    mockedAxios.post.mockResolvedValue({ data: mockResponseData });

    await generateImage(apiKey, params);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.openai.com/v1/images/generations',
      params, // All params should be passed as is, including n:1
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
  });

  it('should handle API error response from Axios (simulating AxiosError structure)', async () => {
    const params: DalleRequest = { prompt: 'Error case' };
    const apiErrorResponse = { data: { error: { message: 'Test API error' } } };
    const mockError = new Error('Request failed with status code xxx');
    // Attach additional properties to mimic AxiosError structure recognized by the code
    Object.assign(mockError, { response: apiErrorResponse });
    // isAxiosError is a type guard. We make our mockError identifiable by it.
    // A simple way for the unit test is to ensure `axios.isAxiosError` returns true for this error.
    // We'll mock `axios.isAxiosError` for the scope of this test.

    mockedAxios.post.mockRejectedValue(mockError);

    // Save original and mock axios.isAxiosError
    const originalIsAxiosError = axios.isAxiosError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (axios as any).isAxiosError = jest.fn(
      (e: unknown) => e === mockError || originalIsAxiosError(e)
    );

    await expect(generateImage(apiKey, params)).rejects.toThrow(
      'DALL-E API error: Test API error'
    );

    // Restore original axios.isAxiosError
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (axios as any).isAxiosError = originalIsAxiosError;
  });

  it('should handle generic error if API error structure is unexpected', async () => {
    const params: DalleRequest = { prompt: 'Generic error case' };
    const genericError = new Error('Network failure');
    // Ensure isAxiosError is false for this error by not giving it specific Axios properties
    mockedAxios.post.mockRejectedValue(genericError);
    await expect(generateImage(apiKey, params)).rejects.toThrow(
      'Network failure'
    );
  });
});
