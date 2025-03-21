# LaunchDarkly MCP Integration

An MCP (Model Context Protocol) integration for querying LaunchDarkly feature flags and other resources.

## Features

- List LaunchDarkly projects
- List environments within a project
- List and search feature flags
- Get detailed information about specific feature flags
- Check feature flag status across environments

## Prerequisites

- Node.js 18+
- LaunchDarkly API access token with appropriate permissions

## Project Structure

```
/src
  /tools                    # Feature-specific tools
    environments.ts         # Environment-related tools
    featureFlags.ts         # Feature flag operations
    index.ts                # Tool registration
    projects.ts             # Project management tools
    search.ts               # Search functionality
  api.ts                    # API request handling
  config.ts                 # Configuration and env variables
  index.ts                  # Main application entry
```

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Configuration

There are two ways to configure the API key:

1. **Environment Variable**:
   ```bash
   export LD_API_KEY="api-xxxx"
   ```

2. **.env File**:
   - Copy `.env.example` to `.env`
   - Update the values in the `.env` file
   ```bash
   cp .env.example .env
   # Edit .env with your API key
   ```

## Usage

### Running the MCP Server

```bash
npm start
```

### Integration with Claude Desktop

1. Go to **Claude** > **Settings** > **Developer** > **Edit Config** > **claude_desktop_config.json**
2. Add the following configuration:

```json
{
    "mcpServers": {
        "launchdarkly": {
            "command": "node",
            "args": [
                "/path/to/ldmcp/dist/index.js"
            ],
            "env": {
                "LD_API_KEY": "api-xxxxxx"
            }
        }
    }
}
```

Replace `/path/to/ldmcp` with the actual path to this repository and `api-xxxxxx` with your actual LaunchDarkly API key.

### Multiple MCP Integrations Example

You can configure multiple MCP integrations in Claude Desktop:

```json
{
    "mcpServers": {
        "launchdarkly": {
            "command": "node",
            "args": [
                "/path/to/ldmcp/dist/index.js"
            ],
            "env": {
                "LD_API_KEY": "api-xxxxxx"
            }
        },
    }
}
```

### Integration with Cursor

Go to **Cursor Settings** > **MCP** and add a new MCP command:

```
node /path/to/ldmcp/dist/index.js
```

You'll also need to set the LD_API_KEY environment variable when launching Cursor.

## Available Tools

The following tools are available through this MCP integration:

- `listProjects`: List all projects in LaunchDarkly
- `listEnvironments`: List all environments in a specific project
- `listFeatureFlags`: List feature flags in a project with optional filtering
- `getFeatureFlag`: Get detailed information about a specific feature flag
- `getFeatureFlagStatus`: Check the status of a feature flag across environments
- `searchFeatureFlags`: Search for feature flags across all projects

## Example Queries for Claude

Here are some example queries you can ask Claude once the MCP is connected:

- "List all the LaunchDarkly projects"
- "Show me all environments in the 'default' project"
- "List feature flags in the 'default' project"
- "Get details about the 'dark-mode' feature flag in the 'default' project"
- "Is the 'new-signup-flow' flag enabled in production?"
- "Search for all feature flags related to 'beta' features"

## Development

### Adding New Features

To add new LaunchDarkly API capabilities:

1. Create or modify a tool module in the `/src/tools` directory
2. Register your tool in the appropriate file
3. Rebuild with `npm run build`

## License

ISC
