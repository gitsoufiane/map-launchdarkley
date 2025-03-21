import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';
import './config.js'; // Load env variables and validate

const server = new McpServer({
  name: 'LaunchDarkly MCP',
  version: '1.0.0',
  description: 'Query LaunchDarkly feature flags and other resources',
});

// Register all tools
registerAllTools(server);

// Start the server
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => console.log('LaunchDarkly MCP server started'))
  .catch(error => console.error('Failed to start LaunchDarkly MCP server:', error));
