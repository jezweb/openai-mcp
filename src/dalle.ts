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
    url: string;
    revised_prompt?: string;
    b64_json?: string;
  }[];
}

/**
 * Generate an image using OpenAI's DALL-E API
 * 
 * @param apiKey - OpenAI API key
 * @param params - DALL-E API request parameters
 * @returns Promise resolving to the DALL-E API response
 */
export async function generateImage(apiKey: string, params: DalleRequest): Promise<DalleResponse> {
  // Set default values for optional parameters
  const requestParams: DalleRequest = {
    prompt: params.prompt,
    model: params.model || 'dall-e-3',
    n: params.n || 1,
    size: params.size || '1024x1024',
    quality: params.quality || 'standard',
    style: params.style || 'vivid',
    response_format: params.response_format || 'url',
    user: params.user
  };

  try {
    // Make the API request to OpenAI
    const response = await axios.post<DalleResponse>(
      'https://api.openai.com/v1/images/generations',
      requestParams,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    return response.data;
  } catch (error) {
    // Handle API errors
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data.error?.message || 'Unknown error';
      throw new Error(`DALL-E API error: ${errorMessage}`);
    }
    throw error;
  }
}