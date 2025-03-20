// Load environment variables from .env file if present
import dotenv from 'dotenv';
dotenv.config();

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fetch from 'node-fetch';

const server = new McpServer({
  name: 'LaunchDarkly MCP',
  version: '1.0.0',
  description: 'Query LaunchDarkly feature flags and other resources',
});

// Environment variables or configuration for LaunchDarkly API
const LD_API_KEY = process.env.LD_API_KEY;
const LD_BASE_URL = 'https://app.launchdarkly.com/api/v2';

// Verify required environment variables
if (!LD_API_KEY) {
  console.error('Error: LD_API_KEY environment variable is required');
  process.exit(1);
}

// Helper function to make authenticated requests to LaunchDarkly API
async function ldRequest(endpoint: string, method = 'GET', body?: any) {
  const headers = {
    'Authorization': `${LD_API_KEY}`,
    'Content-Type': 'application/json'
  };

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${LD_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`LaunchDarkly API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling LaunchDarkly API:', error);
    throw error;
  }
}

// Tool to list all projects
server.tool('listProjects', {}, async (_, extra) => {
  try {
    const projects = await ldRequest('/projects');
    return {
      content: [
        {
          type: 'text',
          text: `Found ${projects.items?.length || 0} projects in LaunchDarkly.`,
        },
        {
          type: 'text',
          text: JSON.stringify(projects.items?.map((p: any) => ({
            key: p.key,
            name: p.name,
            environments: p._environments?.length || 0,
          })) || [], null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching projects: ${error.message}`,
        },
      ],
    };
  }
});

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

// Tool to list feature flags in a project
server.tool('listFeatureFlags', {
  projectKey: z.string().describe('The project key to list feature flags for'),
  query: z.string().optional().describe('Optional query to filter feature flags'),
  limit: z.number().min(1).max(100).default(20).optional().describe('Maximum number of flags to return'),
  offset: z.number().min(0).default(0).optional().describe('Offset for pagination'),
  tag: z.string().optional().describe('Filter by tag'),
}, async ({ projectKey, query, limit, offset, tag }, extra) => {
  try {
    let endpoint = `/flags/${projectKey}?limit=${limit}&offset=${offset}`;
    
    if (query) {
      endpoint += `&filter=${encodeURIComponent(query)}`;
    }
    
    if (tag) {
      endpoint += `&tag=${encodeURIComponent(tag)}`;
    }
    
    const flags = await ldRequest(endpoint);
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${flags.items?.length || 0} feature flags in project "${projectKey}".`,
        },
        {
          type: 'text',
          text: JSON.stringify(flags.items?.map((flag: any) => ({
            key: flag.key,
            name: flag.name,
            description: flag.description || '',
            variations: flag.variations?.length || 0,
            tags: flag._tags || [],
            maintainer: flag._maintainer?.name || '',
            kind: flag.kind || 'boolean',
          })) || [], null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching feature flags for project "${projectKey}": ${error.message}`,
        },
      ],
    };
  }
});

// Tool to get detailed information about a specific feature flag
server.tool('getFeatureFlag', {
  projectKey: z.string().describe('The project key the feature flag belongs to'),
  flagKey: z.string().describe('The key of the feature flag to retrieve'),
}, async ({ projectKey, flagKey }, extra) => {
  try {
    const flag = await ldRequest(`/flags/${projectKey}/${flagKey}`);
    
    const flagData = {
      key: flag.key,
      name: flag.name,
      description: flag.description || '',
      kind: flag.kind,
      variations: flag.variations,
      tags: flag._tags || [],
      maintainer: flag._maintainer?.name || '',
      creationDate: flag._creationDate,
      version: flag.version,
      defaults: flag.defaults,
      clientSideAvailability: flag.clientSideAvailability,
    };
    
    return {
      content: [
        {
          type: 'text',
          text: `Details for feature flag "${flagKey}" in project "${projectKey}":`,
        },
        {
          type: 'text',
          text: JSON.stringify(flagData, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching feature flag "${flagKey}" in project "${projectKey}": ${error.message}`,
        },
      ],
    };
  }
});

// Tool to get flag status across environments
server.tool('getFeatureFlagStatus', {
  projectKey: z.string().describe('The project key the feature flag belongs to'),
  flagKey: z.string().describe('The key of the feature flag to check status for'),
  environmentKey: z.string().optional().describe('Optional: specific environment to check status for'),
}, async ({ projectKey, flagKey, environmentKey }, extra) => {
  try {
    let endpoint = `/flag-statuses/${projectKey}/${flagKey}`;
    if (environmentKey) {
      endpoint += `/environments/${environmentKey}`;
    }
    
    const status = await ldRequest(endpoint);
    
    if (environmentKey) {
      const statusData = {
        environment: status.name,
        status: status._status || {},
        lastRequested: status._lastRequested,
        enabled: status.on,
        archived: status._archived || false,
        rules: status.rules?.length || 0,
        fallthrough: status.fallthrough,
        offVariation: status.offVariation,
        prerequisites: status.prerequisites?.length || 0,
      };
      
      return {
        content: [
          {
            type: 'text',
            text: `Status for feature flag "${flagKey}" in environment "${environmentKey}":`,
          },
          {
            type: 'text',
            text: JSON.stringify(statusData, null, 2),
          },
        ],
      };
    } else {
      const statusData = Object.entries(status.environments || {}).map(([envKey, env]: [string, any]) => ({
        environmentKey: envKey,
        environmentName: env.name,
        enabled: env.on,
        lastRequested: env._lastRequested,
        status: env._status || {},
      }));
      
      return {
        content: [
          {
            type: 'text',
            text: `Status for feature flag "${flagKey}" across all environments:`,
          },
          {
            type: 'text',
            text: JSON.stringify(statusData, null, 2),
          },
        ],
      };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching status for feature flag "${flagKey}": ${error.message}`,
        },
      ],
    };
  }
});

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

// Start the server
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => console.log('LaunchDarkly MCP server started'))
  .catch(error => console.error('Failed to start LaunchDarkly MCP server:', error));
