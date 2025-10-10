#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class HealthChecker {
  constructor() {
    this.baseUrl = process.env.PORTAL_URL || 'http://localhost:5174';
    this.apiUrl = process.env.API_URL || 'http://localhost:8080';
  }

  async checkEndpoint(url, name, expectedStatus = 200) {
    try {
      const response = await fetch(url, { timeout: 5000 });
      const status = response.status;
      const success = status === expectedStatus;

      console.log(`${success ? '✅' : '❌'} ${name}: ${url} (${status})`);

      if (!success) {
        console.log(`   Expected: ${expectedStatus}, Got: ${status}`);
      }

      return success;
    } catch (error) {
      console.log(`❌ ${name}: ${url} (Connection failed - ${error.message})`);
      return false;
    }
  }

  async runHealthCheck() {
    console.log('🏥 Cable Platform Health Check');
    console.log('==============================\n');

    const checks = [
      // Portal checks
      { url: this.baseUrl, name: 'Portal Home', expected: 200 },
      { url: `${this.baseUrl}/admin`, name: 'Admin Section', expected: 200 },
      { url: `${this.baseUrl}/projects`, name: 'Projects Page', expected: 200 },
      { url: `${this.baseUrl}/quotes`, name: 'Quotes Page', expected: 200 },
      { url: `${this.baseUrl}/orders`, name: 'Orders Page', expected: 200 },

      // API Gateway checks
      { url: `${this.apiUrl}/v1/me`, name: 'API /me', expected: 200 },
      { url: `${this.apiUrl}/config`, name: 'API /config', expected: 200 },
    ];

    let passed = 0;
    let total = checks.length;

    for (const check of checks) {
      const success = await this.checkEndpoint(check.url, check.name, check.expected);
      if (success) passed++;
    }

    console.log(`\n📊 Results: ${passed}/${total} checks passed`);

    if (passed === total) {
      console.log('🎉 All services are healthy!');
    } else {
      console.log('⚠️  Some services may need attention.');
    }

    return passed === total;
  }

  showMCPHealthCommands() {
    console.log('\n🤖 MCP Health Check Commands');
    console.log('=============================\n');

    console.log('Use these commands with your MCP-enabled AI assistant:\n');

    const commands = [
      '"Navigate to http://localhost:5174 and verify the page loads without errors"',
      '"Check the browser console for any JavaScript errors on the home page"',
      '"Navigate to /admin and verify the DEV badge is visible"',
      '"Test the sidebar navigation by clicking each main link"',
      '"Take a screenshot of the dashboard to verify visual layout"',
      '"Check network requests and verify no failed API calls"',
      '"Test responsive design by resizing the browser window"',
      '"Verify all images and assets load correctly"',
    ];

    commands.forEach((cmd, i) => {
      console.log(`${i + 1}. ${cmd}`);
    });

    console.log('\n💡 These MCP commands provide deeper health insights than basic HTTP checks.');
  }

  showAutomatedWorkflow() {
    console.log('\n🔄 Automated Health Monitoring');
    console.log('===============================\n');

    console.log('Set up automated health checks:\n');

    console.log('1. Daily Health Check:');
    console.log('   node scripts/health-check.js\n');

    console.log('2. MCP Visual Monitoring:');
    console.log('   - Start MCP server: cd services/mcp-playwright && pnpm run mcp');
    console.log('   - Ask AI: "Monitor the application for visual regressions daily"\n');

    console.log('3. CI/CD Integration:');
    console.log('   - Add health checks to GitHub Actions');
    console.log('   - Run MCP visual tests on deployments');
    console.log('   - Alert on service failures\n');

    console.log('4. Development Monitoring:');
    console.log('   - Check health before starting development');
    console.log('   - Monitor during development sessions');
    console.log('   - Validate before committing changes\n');
  }

  async run() {
    const command = process.argv[2];

    switch (command) {
      case 'mcp':
        this.showMCPHealthCommands();
        break;
      case 'automate':
        this.showAutomatedWorkflow();
        break;
      case 'check':
      default:
        const healthy = await this.runHealthCheck();
        if (!healthy) {
          console.log('\n💡 Try using MCP for deeper diagnostics:');
          console.log('   node scripts/health-check.js mcp');
        }
        break;
    }
  }
}

// Run the health checker
const checker = new HealthChecker();
checker.run().catch(console.error);
