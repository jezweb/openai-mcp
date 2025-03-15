#!/usr/bin/env node

/**
 * OpenAI MCP Server
 * 
 * This is the main entry point for the OpenAI MCP server. It sets up the MCP server
 * with tools for interacting with OpenAI's APIs, particularly the DALL-E image generation API.
 * 
 * The server can be run in two modes:
 * 1. Serve mode: Starts the MCP server to handle requests from MCP clients
 * 2. Install mode: Installs the MCP server configuration for Roo Code or Claude Desktop
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Command } from 'commander';
import { generateImage, DalleRequest } from './dalle.js';
import { installMcpServer } from './install.js';

// Define the OpenAI API key environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Main MCP server class for OpenAI API integration
 */
class OpenAIMcpServer {
  private server: Server;

  constructor() {
    // Initialize the MCP server
    this.server = new Server(
      {
        name: 'openai-mcp',
        version: '1.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up request handlers
    this.setupToolHandlers();
    
    // Set up error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up MCP tool handlers for OpenAI API integration
   */
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_image',
          description: 'Generate an image using OpenAI\'s DALL-E API',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Text description of the desired image',
              },
              model: {
                type: 'string',
                description: 'DALL-E model to use (dall-e-2 or dall-e-3)',
                enum: ['dall-e-2', 'dall-e-3'],
              },
              n: {
                type: 'number',
                description: 'Number of images to generate (1-10)',
                minimum: 1,
                maximum: 10,
              },
              size: {
                type: 'string',
                description: 'Size of the generated image',
                enum: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'],
              },
              quality: {
                type: 'string',
                description: 'Quality of the generated image',
                enum: ['standard', 'hd'],
              },
              style: {
                type: 'string',
                description: 'Style of the generated image',
                enum: ['vivid', 'natural'],
              },
              response_format: {
                type: 'string',
                description: 'Format of the response',
                enum: ['url', 'b64_json'],
              },
              user: {
                type: 'string',
                description: 'A unique identifier for the end-user',
              },
            },
            required: ['prompt'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'generate_image') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      // Check if API key is provided
      if (!OPENAI_API_KEY) {
        throw new McpError(
          ErrorCode.InternalError,
          'OPENAI_API_KEY environment variable is required'
        );
      }

      try {
        // Generate the image using DALL-E API
        const response = await generateImage(
          OPENAI_API_KEY,
          request.params.arguments as DalleRequest
        );

        // Format the response for MCP
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                created: response.created,
                url: response.data[0].url,
                revised_prompt: response.data[0].revised_prompt,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        // Handle errors
        if (error instanceof Error) {
          return {
            content: [
              {
                type: 'text',
                text: error.message,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  /**
   * Run the MCP server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('OpenAI MCP server running on stdio');
  }
}

// Set up command-line interface
const program = new Command();

program
  .name('openai-mcp')
  .description('MCP server for OpenAI API integration')
  .version('1.1.0');

// Serve command - starts the MCP server
program
  .command('serve')
  .description('Start the MCP server')
  .action(() => {
    const server = new OpenAIMcpServer();
    server.run().catch(console.error);
  });

// Install command - installs the MCP server configuration
program
  .command('install')
  .description('Install the MCP server configuration for Roo Code or Claude Desktop')
  .action(() => {
    installMcpServer();
  });

// Parse command-line arguments
program.parse();
