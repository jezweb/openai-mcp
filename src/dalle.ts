/**
 * DALL-E API Integration for OpenAI MCP
 *
 * This module provides a comprehensive implementation for connecting to OpenAI's DALL-E API
 * with support for all available options. It handles the API requests, response parsing,
 * and error handling for image generation.
 */

import axios from 'axios';

// Define the interface for DALL-E API request parameters
export interface DalleRequest {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  quality?: string;
  style?: string;
  response_format?: string;
  user?: string;
}

// Define the interface for DALL-E API response
export interface DalleResponse {
  created: number;
  data: {
    url?: string; // url can be undefined if response_format is b64_json
    b64_json?: string; // b64_json can be undefined if response_format is url
    revised_prompt?: string;
  }[];
}

/**
 * Generate an image using OpenAI's DALL-E API
 *
 * @param apiKey - OpenAI API key
 * @param params - DALL-E API request parameters
 * @returns Promise resolving to the DALL-E API response
 */
export async function generateImage(
  apiKey: string,
  params: DalleRequest
): Promise<DalleResponse> {
  // Set default values for optional parameters
  const model = params.model || 'dall-e-3'; // Default to dall-e-3
  let n = params.n;

  if (model === 'dall-e-3') {
    if (n !== undefined && n > 1) {
      throw new Error(
        'DALL-E 3 only supports generating 1 image at a time (n=1).'
      );
    }
    n = 1; // DALL-E 3 requires n=1
  } else {
    // For dall-e-2, if n is not provided, default to 1.
    // If provided, it will be validated by the Zod schema in index.ts (1-10)
    n = n || 1;
  }

  const requestParams: DalleRequest = {
    prompt: params.prompt,
    model: model,
    n: n,
    size: params.size || '1024x1024', // Default size
    quality: params.quality || 'standard', // Default quality
    style: params.style || 'vivid', // Default style
    response_format: params.response_format || 'url',
    user: params.user,
  };

  try {
    // Make the API request to OpenAI
    const response = await axios.post<DalleResponse>(
      'https://api.openai.com/v1/images/generations',
      requestParams,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    // Handle API errors
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage =
        error.response.data.error?.message || 'Unknown error';
      throw new Error(`DALL-E API error: ${errorMessage}`);
    }
    throw error;
  }
}
