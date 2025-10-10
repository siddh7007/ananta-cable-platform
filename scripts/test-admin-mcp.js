#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AdminTester {
  constructor() {
    this.baseUrl = 'http://localhost:5174';
    this.adminUrl = `${this.baseUrl}/admin`;
  }

  async runMCPServer() {
    console.log('🚀 Starting MCP Playwright server for admin testing...');

    const mcpProcess = spawn('npx', ['@playwright/mcp', 'mcp-server-playwright'], {
      stdio: 'pipe', // Capture output for interaction
      cwd: join(__dirname, '..', 'services', 'mcp-playwright'),
      shell: true,
    });

    // Give server time to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return mcpProcess;
  }

  showAdminTestScenarios() {
    console.log('\n🧪 Admin Section Test Scenarios');
    console.log('===============================\n');

    const scenarios = {
      'Authentication & Access': [
        'Navigate to /admin and verify DEV badge appears',
        'Test 403 error when DEV_AUTH_BYPASS=false',
        'Verify admin navigation loads correctly',
        'Check user roles are properly validated',
      ],

      'UI Components': [
        'Verify sidebar Admin link is visible and clickable',
        'Check admin sub-navigation (Overview, Users, DB, etc.)',
        'Test responsive design on mobile viewport',
        'Verify DEV badge styling and positioning',
      ],

      'Navigation & Routing': [
        'Click each admin sub-page link and verify navigation',
        'Test browser back/forward buttons in admin section',
        'Verify URL changes correctly for each sub-page',
        'Check page titles update appropriately',
      ],

      'Error Handling': [
        'Test 403 page styling and messaging',
        'Verify "Back to Home" button works',
        'Check error page on invalid admin URLs',
        'Test graceful handling of network errors',
      ],

      'Content & Functionality': [
        'Verify admin dashboard cards are clickable',
        'Check placeholder content on each sub-page',
        'Test card hover effects and styling',
        'Validate admin layout consistency',
      ],
    };

    Object.entries(scenarios).forEach(([category, tests]) => {
      console.log(`📋 ${category}:`);
      tests.forEach((test) => console.log(`   • ${test}`));
      console.log('');
    });
  }

  showMCPCommands() {
    console.log('\n🤖 MCP Commands for Admin Testing');
    console.log('==================================\n');

    const commands = [
      '"Navigate to http://localhost:5174/admin and verify the page loads with a DEV badge"',
      '"Click on the Admin link in the sidebar and check if navigation works"',
      '"Take a screenshot of the admin dashboard and verify all cards are visible"',
      '"Test the responsive design by setting viewport to mobile size"',
      '"Try to access admin without proper authentication and verify 403 error"',
      '"Click each card on the admin dashboard and verify navigation to sub-pages"',
      '"Check that all admin sub-navigation links work correctly"',
      '"Verify the DEV badge styling and positioning on the admin page"',
    ];

    commands.forEach((cmd, i) => {
      console.log(`${i + 1}. ${cmd}`);
    });

    console.log('\n💡 Pro Tips:');
    console.log('• Start with basic navigation tests');
    console.log('• Take screenshots before/after visual changes');
    console.log('• Test on different viewport sizes');
    console.log('• Verify error states and edge cases');
    console.log('• Check accessibility and keyboard navigation');
  }

  showQuickStart() {
    console.log('\n🚀 Quick Start Guide');
    console.log('===================\n');

    console.log('1. Start the development environment:');
    console.log('   pnpm run start  # Starts all services with Docker\n');

    console.log('2. Start MCP server in another terminal:');
    console.log('   cd services/mcp-playwright && pnpm run mcp\n');

    console.log('3. Configure your MCP client (Claude Desktop):');
    console.log('   - Open Claude Desktop settings');
    console.log('   - Add MCP server configuration from mcp-config.json');
    console.log('   - Restart Claude Desktop\n');

    console.log('4. Start testing with AI assistant:');
    console.log('   "Test the admin section functionality using the scenarios above"\n');

    console.log('5. Run automated checks:');
    console.log('   node scripts/dev-toolkit.js check  # Verify services are running');
    console.log('   node scripts/dev-toolkit.js test   # Run test suites\n');
  }

  showIntegrationPoints() {
    console.log('\n🔗 Integration Points');
    console.log('====================\n');

    console.log('🎯 With Existing Tests:');
    console.log('   • Complement Playwright E2E tests in apps/portal/tests/');
    console.log('   • Add visual regression testing to existing suites');
    console.log('   • Use for debugging failing E2E tests\n');

    console.log('📊 With Development Workflow:');
    console.log('   • Test UI changes immediately after implementation');
    console.log('   • Generate screenshots for pull request reviews');
    console.log('   • Validate responsive design during development\n');

    console.log('🚀 With CI/CD Pipeline:');
    console.log('   • Add MCP visual testing to GitHub Actions');
    console.log('   • Automate screenshot comparison on deployments');
    console.log('   • Monitor application health in production\n');

    console.log('👥 With Team Collaboration:');
    console.log('   • Share visual test results with designers');
    console.log('   • Document features with automated screenshots');
    console.log('   • Review UI changes with visual diffs\n');
  }

  async run() {
    const command = process.argv[2];

    switch (command) {
      case 'scenarios':
        this.showAdminTestScenarios();
        break;
      case 'commands':
        this.showMCPCommands();
        break;
      case 'start':
        await this.runMCPServer();
        break;
      case 'integration':
        this.showIntegrationPoints();
        break;
      case 'help':
      default:
        console.log('\n🧪 Admin Section MCP Testing Toolkit');
        console.log('====================================\n');

        console.log('Commands:');
        console.log('  scenarios  - Show test scenarios for admin section');
        console.log('  commands   - Show MCP commands for testing');
        console.log('  start      - Start MCP server for testing');
        console.log('  integration- Show integration points');
        console.log('  help       - Show this help\n');

        this.showQuickStart();
        break;
    }
  }
}

// Run the admin tester
const tester = new AdminTester();
tester.run().catch(console.error);
