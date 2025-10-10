#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Development workflow scripts using Playwright MCP
const workflows = {
  'test-portal': {
    description: 'Test portal UI components and navigation',
    steps: [
      'Navigate to http://localhost:5174',
      'Verify sidebar navigation works',
      'Test admin section access',
      'Check responsive design',
      'Take screenshots of key pages',
    ],
  },

  'validate-admin': {
    description: 'Validate admin section functionality',
    steps: [
      'Navigate to admin section',
      'Test DEV bypass badge',
      'Verify all sub-navigation links',
      'Check 403 handling for unauthorized access',
      'Test card navigation',
    ],
  },

  'screenshot-docs': {
    description: 'Generate visual documentation',
    steps: [
      'Capture dashboard screenshots',
      'Document admin interface',
      'Screenshot responsive breakpoints',
      'Generate feature documentation images',
    ],
  },

  'health-check': {
    description: 'Monitor application health',
    steps: [
      'Check portal availability',
      'Verify API gateway responses',
      'Test authentication flows',
      'Monitor page load performance',
    ],
  },
};

console.log('🚀 Cable Platform Development Workflows with MCP Playwright');
console.log('======================================================\n');

console.log('Available workflows:');
Object.entries(workflows).forEach(([name, workflow]) => {
  console.log(`• ${name}: ${workflow.description}`);
  console.log(`  Steps: ${workflow.steps.join(' → ')}\n`);
});

console.log('Usage:');
console.log('1. Start MCP server: cd services/mcp-playwright && pnpm run mcp');
console.log('2. Configure your MCP client (Claude Desktop) with mcp-config.json');
console.log('3. Ask AI assistant to run workflows like:');
console.log('   "Test the portal UI using the test-portal workflow"');
console.log('   "Validate the admin section with validate-admin workflow"');
console.log('   "Generate screenshots for documentation"');
console.log('   "Run a health check on the application"\n');

console.log('💡 Pro Tips:');
console.log('• Use "take a screenshot of the current page" for quick debugging');
console.log('• Ask "click on the admin link in the sidebar" to test navigation');
console.log('• Use "wait for the page to load completely" before interactions');
console.log('• Request "extract all error messages on the page" for debugging');
console.log('• Ask "fill out the login form with test credentials" for auth testing\n');

// Start MCP server if requested
if (process.argv[2] === '--start') {
  console.log('Starting MCP Playwright server...');
  const mcpProcess = spawn('npx', ['@playwright/mcp', 'mcp-server-playwright'], {
    stdio: 'inherit',
    cwd: join(__dirname, '..'),
    shell: true,
  });

  mcpProcess.on('error', (error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down MCP server...');
    mcpProcess.kill('SIGINT');
    process.exit(0);
  });
}
