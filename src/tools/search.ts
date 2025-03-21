import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ldRequest } from '../api.js';

export function registerSearchTools(server: McpServer) {
  // Tool to search for feature flags across all projects
  server.tool('searchFeatureFlags', {
    query: z.string().describe('Search query to filter feature flags'),
    limit: z.number().min(1).max(100).default(20).optional().describe('Maximum number of flags to return'),
    offset: z.number().min(0).default(0).optional().describe('Offset for pagination'),
    archived: z.boolean().default(false).optional().describe('Include archived flags'),
  }, async ({ query, limit, offset, archived }, extra) => {
    try {
      const endpoint = `/search/feature-flags?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&archived=${archived}`;
      const results = await ldRequest(endpoint);
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${results.items?.length || 0} feature flags matching "${query}".`,
          },
          {
            type: 'text',
            text: JSON.stringify(results.items?.map((flag: any) => ({
              key: flag.key,
              name: flag.name,
              projectKey: flag.projectKey,
              description: flag.description || '',
              tags: flag._tags || [],
              kind: flag.kind || 'boolean',
              archived: flag._archived || false,
            })) || [], null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching for feature flags: ${error.message}`,
          },
        ],
      };
    }
  });
}
