/**
 * Installation script for OpenAI MCP
 *
 * This module provides functionality to install the OpenAI MCP server configuration
 * for Roo Code or Claude Desktop. It detects the appropriate configuration file
 * and adds the MCP server configuration to it.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Install the MCP server configuration for Roo Code or Claude Desktop
 */
export function installMcpServer() {
  console.log('Installing OpenAI MCP server configuration...');

  // Get the path to the executable, resolving symlinks
  let executablePath: string;
  try {
    executablePath = fs.realpathSync(process.argv[1]);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn(
      `Warning: Could not resolve the real path for executable '${process.argv[1]}'. Using the provided path directly. Error: ${message}`
    );
    executablePath = process.argv[1];
  }

  // Try to install for Roo Code
  const rooCodeConfigPath = path.join(
    os.homedir(),
    '.config',
    'Code',
    'User',
    'globalStorage',
    'rooveterinaryinc.roo-cline',
    'settings',
    'cline_mcp_settings.json'
  );

  // Try to install for Claude Desktop
  const claudeDesktopConfigPath = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'Claude',
    'claude_desktop_config.json'
  );

  // Check if Roo Code config exists
  if (fs.existsSync(rooCodeConfigPath)) {
    installToConfig(rooCodeConfigPath, executablePath);
    return;
  }

  // Check if Claude Desktop config exists
  if (fs.existsSync(claudeDesktopConfigPath)) {
    installToConfig(claudeDesktopConfigPath, executablePath);
    return;
  }

  // If neither config exists, show error message
  console.error(
    'Could not find Roo Code or Claude Desktop configuration file.'
  );
  console.error(
    'Please make sure Roo Code or Claude Desktop is installed, or refer to their documentation for MCP server configuration.'
  );
  console.error('\nManual installation instructions:');
  console.error(
    '1. Open or create your MCP settings/configuration JSON file for your development tool.'
  );
  console.error('2. Ensure it contains an "mcpServers" object.');
  console.error('3. Add or update the "openai-mcp" entry as shown below:');
  console.error(
    '   Make sure to replace "your-openai-api-key" with your actual OpenAI API key.'
  );
  console.error(`
  {
    "mcpServers": {
      "openai-mcp": {
        "command": "${executablePath}",
        "args": ["serve"],
        "env": {
          "OPENAI_API_KEY": "your-openai-api-key"
        }
      }
      // ... any other mcpServers ...
    }
    // ... any other settings ...
  }
  `);
  console.error(
    `\nNote: The 'command' path shown above ('${executablePath}') should be the correct path to the openai-mcp executable.`
  );
  console.error('After saving the changes, restart your development tool.');
}

/**
 * Install the MCP server configuration to a specific config file
 *
 * @param configPath - Path to the configuration file
 * @param executablePath - Path to the executable
 */
function installToConfig(configPath: string, executablePath: string) {
  try {
    // Read the existing config
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Initialize mcpServers if it doesn't exist
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Add the OpenAI MCP server configuration
    config.mcpServers['openai-mcp'] = {
      command: executablePath,
      args: ['serve'],
      env: {
        OPENAI_API_KEY: 'your-openai-api-key',
      },
    };

    // Write the updated config back to the file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(
      `Successfully installed OpenAI MCP server configuration to ${configPath}`
    );
    console.log(
      '\nIMPORTANT: You MUST replace "your-openai-api-key" in the configuration file with your actual OpenAI API key for the server to work.'
    );
    console.log(
      `You can edit the configuration file (${configPath}) directly or, if available, use the settings UI in your development tool.`
    );
    console.log(
      '\nAfter updating the API key, restart Roo Code or Claude Desktop for the changes to take effect.'
    );
  } catch (error: unknown) {
    // Changed from any to unknown
    console.error(`\nError installing OpenAI MCP server to ${configPath}:`);
    if (error instanceof SyntaxError) {
      console.error(
        'Failed to parse the existing configuration file. It might be corrupted or not valid JSON.'
      );
      console.error('Please check the file content manually.');
    } else if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error
    ) {
      // More robust check for a NodeJS.ErrnoException-like object
      const fsError = error as { code: string; message: string }; // Type assertion after checks
      switch (fsError.code) {
        case 'EACCES':
          console.error(
            'Permission denied. Could not read or write to the configuration file.'
          );
          break;
        case 'ENOENT':
          console.error(
            'Configuration file not found during the installation process.'
          );
          break;
        case 'EISDIR':
          console.error('The configuration path is a directory, not a file.');
          break;
        default:
          console.error(
            `A file system error occurred: ${fsError.message} (Code: ${fsError.code})`
          );
      }
    } else if (error instanceof Error) {
      console.error(`An unexpected error occurred: ${error.message}`);
    } else {
      // Fallback for other unknown error types
      console.error(`An unexpected error occurred: ${String(error)}`);
    }
    console.error(
      '\nPlease try the manual installation steps provided earlier if automatic installation failed.'
    );
  }
}
