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

  // Get the path to the executable
  const executablePath = process.argv[1];

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
  console.error('Could not find Roo Code or Claude Desktop configuration file.');
  console.error('Please make sure Roo Code or Claude Desktop is installed.');
  console.error('\nManual installation instructions:');
  console.error('1. Add the following to your MCP settings configuration file:');
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
  }
}
`);
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
    let config = JSON.parse(configContent);

    // Initialize mcpServers if it doesn't exist
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Add the OpenAI MCP server configuration
    config.mcpServers['openai-mcp'] = {
      command: executablePath,
      args: ['serve'],
      env: {
        OPENAI_API_KEY: 'your-openai-api-key'
      }
    };

    // Write the updated config back to the file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`Successfully installed OpenAI MCP server configuration to ${configPath}`);
    console.log('\nIMPORTANT: You need to replace "your-openai-api-key" with your actual OpenAI API key.');
    console.log('You can edit the configuration file directly or use the settings UI.');
    console.log('\nRestart Roo Code or Claude Desktop for the changes to take effect.');
  } catch (error) {
    console.error(`Error installing to ${configPath}:`, error);
  }
}