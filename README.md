# OpenAI MCP Server for DALL-E

This project provides a Model Context Protocol (MCP) server for OpenAI's DALL-E API, enabling image generation with support for DALL-E 2 and DALL-E 3 models. It is built using the latest `@modelcontextprotocol/sdk` (v1.12.1) and offers fine-grained control over the image generation process. This server can be integrated with MCP-compatible AI assistants and development tools.

## Features

-   **DALL-E 2 and DALL-E 3 Support**: Generate images using either model.
-   **Comprehensive Parameter Control**: Access to all key DALL-E API parameters including prompt, model, number of images (`n`), size, quality, style, and response format.
-   **MCP Integration**: Designed for use with tools that support the Model Context Protocol.
-   **Built with Modern Tooling**: Uses TypeScript, Zod for schema validation, Jest for testing, ESLint for linting, and Prettier for formatting.

## Tool: `generate_image`

The server exposes a single tool named `generate_image`.

### Input Parameters

The tool accepts the following parameters, mirroring the OpenAI DALL-E API:

-   `prompt` (string, required): A text description of the desired image(s).
-   `model` (string, optional): The DALL-E model to use.
    -   Values: `"dall-e-2"`, `"dall-e-3"`.
    -   Defaults to `"dall-e-3"` if not specified.
-   `n` (number, optional): The number of images to generate.
    -   For `dall-e-2`: Must be between 1 and 10. Defaults to 1.
    -   For `dall-e-3`: Must be 1. The server will enforce this.
-   `size` (string, optional): The size of the generated images. Defaults to `"1024x1024"`.
    -   Supported for `dall-e-2`: `"256x256"`, `"512x512"`, `"1024x1024"`.
    -   Supported for `dall-e-3`: `"1024x1024"`, `"1792x1024"`, `"1024x1792"`.
-   `quality` (string, optional): The quality of the image that will be generated. Defaults to `"standard"`.
    -   Values: `"standard"`, `"hd"`.
    -   `"hd"` is only available for `dall-e-3`.
-   `style` (string, optional): The style of the generated images. Defaults to `"vivid"`.
    -   Values: `"vivid"`, `"natural"`.
    -   Only available for `dall-e-3`.
-   `response_format` (string, optional): The format in which the generated images are returned.
    -   Values: `"url"`, `"b64_json"`. Defaults to `"url"`.
-   `user` (string, optional): A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse.

### Output Format

The `generate_image` tool returns a JSON string containing a `created` timestamp (Unix epoch seconds) and an `images` array. Each object in the `images` array includes either a `url` or `b64_json` data (depending on `response_format`), and may include a `revised_prompt` (especially for DALL-E 3).

**Example Output (for `response_format: 'url'`):**

```json
{
  "created": 1678886400,
  "images": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/private/org-...",
      "revised_prompt": "A photorealistic image of a futuristic cityscape during a vibrant sunset, with neon lights reflecting on wet streets.",
      "b64_json": null
    }
    // ... more images if n > 1 for DALL-E 2
  ]
}
```

**Example Output (for `response_format: 'b64_json'`):**
```json
{
  "created": 1678886401,
  "images": [
    {
      "url": null,
      "revised_prompt": "A detailed pencil sketch of a single blooming rose.",
      "b64_json": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAA..."
    }
  ]
}
```

## Setup and Installation

### Automatic Installation (Recommended)

1.  **Install the package globally:**
    ```bash
    npm install -g openai-mcp
    ```
    (Note: You might need `sudo` depending on your npm configuration.)

2.  **Run the setup command:**
    This command will attempt to automatically detect configuration files for known MCP-compatible tools (like Roo Code or Claude Desktop) and add this server's configuration.
    ```bash
    openai-mcp install
    ```

3.  **Set your OpenAI API Key:**
    After running `openai-mcp install`, the configuration will include a placeholder for your OpenAI API key. You **must** edit the configuration file mentioned by the installer and replace `"your-openai-api-key"` with your actual API key.

    Example of where to set the key (this structure will be part of a larger JSON file):
    ```json
    {
      "mcpServers": {
        "openai-mcp": {
          "command": "/path/to/openai-mcp/build/index.js", // Actual path will be set by installer
          "args": ["serve"],
          "env": {
            "OPENAI_API_KEY": "your-actual-openai-api-key-here"
          }
        }
      }
    }
    ```

4.  **Restart your MCP-compatible tool** for the changes to take effect.

### Manual Installation

If automatic installation fails or you prefer manual setup:

1.  Locate the MCP server configuration file for your specific tool.
2.  Add or update the `mcpServers` object with the following entry, ensuring `OPENAI_API_KEY` is set and the `command` path points to the `openai-mcp` executable (if installed globally, you can try just `"openai-mcp"` as the command; otherwise, use the full path to `build/index.js` within the installed package).

    ```json
    {
      "mcpServers": {
        "openai-mcp": {
          "command": "openai-mcp", // Or full path to .../openai-mcp/build/index.js
          "args": ["serve"],
          "env": {
            "OPENAI_API_KEY": "your-actual-openai-api-key-here"
          }
        }
        // ... other MCP servers ...
      }
      // ... other settings ...
    }
    ```
3.  Save the configuration file and restart your tool.

## Development

This project is written in TypeScript and includes tools for linting, formatting, and testing.

### Project Structure

-   `src/`: Contains the TypeScript source code.
    -   `index.ts`: Main server entry point, tool definition, and argument parsing.
    -   `dalle.ts`: Core logic for interacting with the DALL-E API.
    -   `install.ts`: Script for automatic installation/configuration.
-   `test/`: Contains Jest unit and integration tests.
    -   `dalle.test.ts`: Unit tests for `dalle.ts` (mocks API calls).
    -   `dalle.integration.test.ts`: Integration tests (makes live API calls, requires `OPENAI_API_KEY`).
-   `build/`: Output directory for compiled JavaScript files (generated by `npm run build`).

### Key Configuration Files

-   `.eslintrc.cjs`: ESLint configuration.
-   `.prettierrc.cjs`: Prettier configuration.
-   `jest.config.cjs`: Jest test runner configuration.
-   `tsconfig.json`: TypeScript compiler configuration.

### Available Scripts

-   **Build:**
    ```bash
    npm run build
    ```
    Compiles TypeScript to JavaScript in the `build/` directory.

-   **Format:**
    ```bash
    npm run format
    ```
    Formats code using Prettier.

-   **Lint:**
    ```bash
    npm run lint
    ```
    Lints code using ESLint.

-   **Start Server (Development):**
    ```bash
    ts-node src/index.ts serve
    ```
    Requires `OPENAI_API_KEY` to be set in the environment.

-   **Run as installed command (after `npm link` or global install):**
    ```bash
    openai-mcp serve
    ```

## Testing

The project uses Jest for both unit and integration tests.

-   **Run all tests:**
    ```bash
    npm test
    ```

-   **Unit Tests:**
    -   Located in `test/dalle.test.ts`.
    -   These tests mock external dependencies (like `axios`) and do not make live API calls.
    -   They run by default with `npm test`.

-   **Integration Tests:**
    -   Located in `test/dalle.integration.test.ts`.
    -   These tests make **live calls** to the OpenAI DALL-E API.
    -   They require the `OPENAI_API_KEY` environment variable to be set.
    -   If `OPENAI_API_KEY` is not set, these tests will be skipped automatically.
    -   Ensure you are aware of potential costs associated with API calls when running these tests.

## Key Dependencies

-   `@modelcontextprotocol/sdk` (~1.12.1): For MCP server implementation.
-   `axios`: For making HTTP requests to the OpenAI API.
-   `commander`: For command-line argument parsing.
-   `zod`: For input schema validation.
-   `typescript`, `ts-node`
-   `jest`, `ts-jest`, `@types/jest` (for testing)
-   `eslint`, `prettier`, and related plugins (for code quality)

## License

This project is licensed under the MIT License.