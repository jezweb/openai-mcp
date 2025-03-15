/**
 * Test script for DALL-E API integration
 * 
 * This script provides a direct way to test the DALL-E API integration without using the MCP server.
 * It includes multiple examples with different options to demonstrate the capabilities of the API.
 */

import fetch from 'node-fetch';

// Get the OpenAI API key from environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Check if API key is provided
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

/**
 * Generate an image using OpenAI's DALL-E API
 * 
 * @param {Object} params - DALL-E API request parameters
 * @returns {Promise<Object>} - Promise resolving to the DALL-E API response
 */
async function generateImage(params) {
  // Set default values for optional parameters
  const requestParams = {
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
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestParams)
    });

    // Parse the response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      throw new Error(`DALL-E API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error('Error generating image:', error.message);
    process.exit(1);
  }
}

// Example requests with different options
const examples = [
  {
    name: 'Default',
    params: {
      prompt: 'A cat wearing a hat'
    }
  },
  {
    name: 'HD Quality',
    params: {
      prompt: 'A scenic mountain landscape at sunset',
      quality: 'hd',
      size: '1024x1024'
    }
  },
  {
    name: 'Natural Style',
    params: {
      prompt: 'A futuristic city with flying cars',
      style: 'natural'
    }
  },
  {
    name: 'Wide Format',
    params: {
      prompt: 'A panoramic view of a beach at sunrise',
      size: '1792x1024'
    }
  },
  {
    name: 'Tall Format',
    params: {
      prompt: 'A tall skyscraper reaching into the clouds',
      size: '1024x1792'
    }
  }
];

// Select which example to run (0-4)
const exampleIndex = 0; // Change this to test different examples

// Run the selected example
async function runExample() {
  const example = examples[exampleIndex];
  console.log(`Running example: ${example.name}`);
  console.log(`Generating image with prompt: "${example.params.prompt}" and options:`, example.params);

  const response = await generateImage(example.params);
  
  console.log('Image generated successfully!');
  console.log(`Created at: ${new Date().toLocaleString()}`);
  console.log(`Image URL: ${response.data[0].url}`);
  
  if (response.data[0].revised_prompt) {
    console.log(`Revised prompt: ${response.data[0].revised_prompt}`);
  }

  // Instructions for viewing the image
  console.log('\nTo view the image:');
  console.log('1. Open dalle-test.html in your browser');
  console.log('2. Open the browser console (F12 or right-click > Inspect > Console)');
  console.log('3. Run the following code in the console:');
  console.log(`   const imageUrl = "${response.data[0].url}";`);
  console.log('   document.getElementById(\'image-display\').innerHTML = `<img src="${imageUrl}" alt="DALL-E Generated Image">`;');

  console.log('\nTo test other examples:');
  console.log('1. Edit the exampleIndex variable in test-dalle.js');
  console.log('2. Run the script again with: node test-dalle.js');
}

// Run the example
runExample().catch(console.error);
