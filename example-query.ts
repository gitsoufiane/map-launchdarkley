// Example script showing how to call the LaunchDarkly MCP using the SDK
// This is just for testing and demonstration purposes

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function main() {
  // Start the MCP server
  const serverProcess = spawn('node', ['dist/index.js'], {
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'inherit'] // stdin, stdout, stderr
  });

  // Create client
  const transport = new StdioClientTransport(serverProcess);
  const client = new Client({ transport });

  try {
    await client.connectHandshake();
    console.log('Connected to LaunchDarkly MCP server');

    // Example: List Projects
    const projects = await client.run('listProjects', {});
    console.log('\nProjects:');
    console.log(projects.content[1].text);

    // Example: List Feature Flags (replace with your actual project key)
    try {
      const flags = await client.run('listFeatureFlags', { projectKey: 'default' });
      console.log('\nFeature Flags:');
      console.log(flags.content[1].text);
    } catch (error) {
      console.error('Error fetching flags:', error);
    }

    // You can add more examples here...

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Cleanup
    serverProcess.kill();
    setTimeout(() => process.exit(0), 500);
  }
}

main().catch(console.error);
