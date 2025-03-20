#!/bin/bash
# Make this script executable with: chmod +x setup.sh

# Simple setup script for LaunchDarkly MCP

echo "Setting up LaunchDarkly MCP integration..."

# Install dependencies
npm install

# Build TypeScript
npm run build


echo "Setup complete!"
echo ""
echo "To start the MCP server, run:"
echo "npm start"
echo ""
echo "For details on integrating with Claude or Cursor, see the README.md file."

npm start