import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ldRequest } from '../api.js';

export function registerEnvironmentTools(server: McpServer) {
  // Tool to list all environments in a project
  server.tool('listEnvironments', {
    projectKey: z.string().describe('The project key to list environments for'),
  }, async ({ projectKey }, extra) => {
    try {
      const environments = await ldRequest(`/projects/${projectKey}/environments`);
      return {
        content: [
          {
            type: 'text',
            text: `Found ${environments.items?.length || 0} environments in project "${projectKey}".`,
          },
          {
            type: 'text',
            text: JSON.stringify(environments.items?.map((env: any) => ({
              key: env.key,
              name: env.name,
              color: env.color,
              default: env._default || false,
            })) || [], null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching environments for project "${projectKey}": ${error.message}`,
          },
        ],
      };
    }
  });
}
