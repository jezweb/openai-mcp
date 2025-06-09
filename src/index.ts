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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// ErrorCode and McpError might not be needed if errors are handled per tool.
// ListToolsRequestSchema and CallToolRequestSchema are replaced by server.tool()
import { Command } from 'commander';
import * as z from 'zod';
import { generateImage, DalleRequest } from './dalle.js';
import { installMcpServer } from './install.js';

// Define the OpenAI API key environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Main MCP server class for OpenAI API integration
 */
class OpenAIMcpServer {
  private server: McpServer;

  constructor() {
    // Initialize the MCP server
    this.server = new McpServer({
      name: 'openai-mcp',
      version: '1.1.0',
      // Capabilities are often defined via server.tool() or similar methods in newer SDKs
    });

    // Set up request handlers
    this.defineTools();

    // Set up error handling - server.onerror might be deprecated.
    // Errors are typically handled within tool handlers or via a global mechanism
    // if provided by the SDK. For now, relying on per-tool error returns.
    // console.error('[MCP Error]', error); // Old error handling
    process.on('SIGINT', async () => {
      console.error('SIGINT received, shutting down server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Define MCP tools for OpenAI API integration using the new server.tool() method
   */
  private defineTools() {
    // Base schema for SDK's initial validation (raw shape)
    const baseDalleSchemaShape = {
      prompt: z.string().describe('Text description of the desired image'),
      model: z
        .enum(['dall-e-2', 'dall-e-3'])
        .optional()
        .describe(
          'DALL-E model to use (dall-e-2 or dall-e-3). Defaults to dall-e-3 if not specified.'
        ),
      n: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe(
          'Number of images to generate (1-10 for dall-e-2, must be 1 for dall-e-3). Defaults to 1.'
        ),
      size: z
        .enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
        .optional()
        .describe(
          'Size of the generated image. 256x256, 512x512 are for DALL-E 2. 1792x1024, 1024x1792 are for DALL-E 3. 1024x1024 is for both. Defaults to 1024x1024.'
        ),
      quality: z
        .enum(['standard', 'hd'])
        .optional()
        .describe(
          'Quality of the generated image (standard or hd). "hd" is only available for DALL-E 3. Defaults to standard.'
        ),
      style: z
        .enum(['vivid', 'natural'])
        .optional()
        .describe(
          'Style of the generated image (vivid or natural). Only available for DALL-E 3. Defaults to vivid.'
        ),
      response_format: z
        .enum(['url', 'b64_json'])
        .optional()
        .describe('Format of the response (url or b64_json). Defaults to url.'),
      user: z
        .string()
        .optional()
        .describe('A unique identifier for the end-user'),
    };

    // Refined schema for use within the handler to get detailed error messages
    const refinedDalleSchema = z
      .object(baseDalleSchemaShape)
      .superRefine((val, ctx) => {
        const model = val.model || 'dall-e-3'; // Apply default for refinement logic

        // DALL-E 3 specific 'n' validation
        if (model === 'dall-e-3' && val.n !== undefined && val.n !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['n'],
            message: "For DALL-E 3, 'n' must be 1.",
          });
        }

        // 'hd' quality validation
        if (val.quality === 'hd' && model !== 'dall-e-3') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['quality'],
            message: "'hd' quality is only available with DALL-E 3.",
          });
        }

        // 'style' validation
        if (val.style !== undefined && model !== 'dall-e-3') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['style'],
            message: "'style' is only available with DALL-E 3.",
          });
        }

        // DALL-E 2 size validation
        if (
          model === 'dall-e-2' &&
          val.size &&
          (val.size === '1792x1024' || val.size === '1024x1792')
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['size'],
            message: `Sizes '1792x1024' and '1024x1792' are only available for DALL-E 3.`,
          });
        }

        // DALL-E 3 size validation
        if (
          model === 'dall-e-3' &&
          val.size &&
          (val.size === '256x256' || val.size === '512x512')
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['size'],
            message: `Sizes '256x256' and '512x512' are only available for DALL-E 2.`,
          });
        }
      });

    this.server.tool(
      'generate_image',
      baseDalleSchemaShape, // Pass the raw shape for SDK's basic validation
      async (rawParams: DalleRequest) => {
        // Handler function receives raw params
        try {
          // Perform detailed validation using the refined schema
          const params = refinedDalleSchema.parse(rawParams);

          // Check if API key is provided
          if (!OPENAI_API_KEY) {
            // This was originally an McpError, returning it in the new format
            return {
              content: [
                {
                  type: 'text',
                  text: 'OPENAI_API_KEY environment variable is required',
                },
              ],
              isError: true,
            };
          }

          // Generate the image using DALL-E API
          const response = await generateImage(OPENAI_API_KEY, params);

          // Format the response for MCP
          if (response.data && response.data.length > 0) {
            const imageResults = response.data.map((image) => ({
              url: image.url,
              revised_prompt: image.revised_prompt,
              b64_json: image.b64_json, // Include if present
            }));

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      // Wrap the array in an object with a 'images' key for better structure
                      created: response.created,
                      images: imageResults,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } else {
            // Handle cases where response.data might be empty or undefined
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    { created: response.created, images: [] },
                    null,
                    2
                  ),
                },
              ],
            };
          }
        } catch (error) {
          let message = 'An unknown error occurred.';
          if (error instanceof z.ZodError) {
            // Format Zod errors for better readability
            message = error.errors
              .map((e) => `${e.path.join('.')}: ${e.message}`)
              .join('; ');
          } else if (error instanceof Error) {
            message = error.message;
          }

          console.error(`[generate_image tool Error] ${message}`, error);
          return {
            content: [{ type: 'text', text: message }],
            isError: true,
          };
        }
      }
    );
  }

  /**
          // This was originally an McpError, returning it in the new format
          return {
            content: [{ type: 'text', text: 'OPENAI_API_KEY environment variable is required' }],
            isError: true,
          };
        }

        try {
          // Generate the image using DALL-E API
          // params are already validated by zod against the schema
          const response = await generateImage(OPENAI_API_KEY, params);

          // Format the response for MCP
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  created: response.created,
                  // Assuming response.data is an array and we take the first element
                  url: response.data[0]?.url,
                  b64_json: response.data[0]?.b64_json,
                  revised_prompt: response.data[0]?.revised_prompt,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          // Handle errors
          const message = error instanceof Error ? error.message : 'An unknown error occurred';
          if (error instanceof Error && (error as any).response?.data?.error?.message) {
            // Try to get a more specific error from OpenAI
            // message = (error as any).response.data.error.message;
          }
          console.error(`[generate_image tool Error] ${message}`, error);
          return {
            content: [{ type: 'text', text: message }],
            isError: true,
          };
        }
      }
    );
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
  .description(
    'Install the MCP server configuration for Roo Code or Claude Desktop'
  )
  .action(() => {
    installMcpServer();
  });

// Parse command-line arguments
program.parse();
