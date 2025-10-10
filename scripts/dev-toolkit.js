#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DevToolkit {
  constructor() {
    this.baseUrl = process.env.PORTAL_URL || 'http://localhost:5174';
    this.apiUrl = process.env.API_URL || 'http://localhost:8080';
  }

  async runCommand(command, description) {
    console.log(`\n🔧 ${description}...`);
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        stdio: 'inherit',
        shell: true,
        cwd: join(__dirname, '..'),
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${description} completed`);
          resolve();
        } else {
          console.log(`❌ ${description} failed`);
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  async checkServices() {
    console.log('\n🔍 Checking service availability...');

    const services = [
      { name: 'Portal', url: this.baseUrl, expected: 200 },
      { name: 'API Gateway', url: `${this.apiUrl}/health`, expected: 200 },
      { name: 'API /me endpoint', url: `${this.apiUrl}/v1/me`, expected: 200 },
      { name: 'API /config endpoint', url: `${this.apiUrl}/config`, expected: 200 },
    ];

    for (const service of services) {
      try {
        const response = await fetch(service.url);
        if (response.status === service.expected) {
          console.log(`✅ ${service.name}: ${service.url} (${response.status})`);
        } else {
          console.log(`⚠️  ${service.name}: ${service.url} (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${service.name}: ${service.url} (Connection failed)`);
      }
    }
  }

  async generateScreenshots() {
    console.log('\n📸 Generating development screenshots...');

    const screenshots = [
      { name: 'dashboard', url: `${this.baseUrl}/`, description: 'Main dashboard' },
      { name: 'admin', url: `${this.baseUrl}/admin`, description: 'Admin section' },
      { name: 'projects', url: `${this.baseUrl}/projects`, description: 'Projects page' },
      { name: 'quotes', url: `${this.baseUrl}/quotes`, description: 'Quotes page' },
      { name: 'orders', url: `${this.baseUrl}/orders`, description: 'Orders page' },
    ];

    const outputDir = join(__dirname, '..', 'docs', 'screenshots');
    await fs.mkdir(outputDir, { recursive: true });

    console.log('💡 Use MCP server to capture these screenshots:');
    screenshots.forEach((screenshot) => {
      console.log(
        `   "Navigate to ${screenshot.url} and take a full page screenshot, save as docs/screenshots/${screenshot.name}.png"`,
      );
    });
  }

  async runTests() {
    console.log('\n🧪 Running test suites...');

    const testCommands = [
      {
        command: 'cd apps/portal && pnpm test',
        description: 'Run portal Playwright tests',
      },
      {
        command: 'cd services/api-gateway && pnpm test',
        description: 'Run API Gateway tests',
      },
      {
        command: 'cd services/mcp-playwright && pnpm test',
        description: 'Run MCP Playwright tests',
      },
    ];

    for (const test of testCommands) {
      try {
        await this.runCommand(test.command, test.description);
      } catch (error) {
        console.log(`⚠️  ${test.description} failed, continuing...`);
      }
    }
  }

  async lintCode() {
    console.log('\n🔍 Running code linting...');
    await this.runCommand('pnpm lint', 'Lint all code');
  }

  async buildServices() {
    console.log('\n🏗️  Building services...');
    await this.runCommand('pnpm build', 'Build all services');
  }

  showMCPWorkflows() {
    console.log('\n🤖 MCP Development Workflows:');
    console.log('==============================');

    const workflows = {
      'UI Testing': [
        'Navigate to portal and verify sidebar loads',
        'Test admin section access and DEV badge',
        'Check responsive design on mobile viewport',
        'Verify form submissions work correctly',
        'Test error handling and 403 pages',
      ],

      'Visual Regression': [
        'Take baseline screenshots of all pages',
        'Compare against previous versions',
        'Flag any unexpected visual changes',
        'Generate visual diff reports',
      ],

      'User Journey Testing': [
        'Test complete user workflows end-to-end',
        'Verify authentication flows',
        'Check data persistence across pages',
        'Validate business logic implementation',
      ],

      'Accessibility Testing': [
        'Check keyboard navigation works',
        'Verify screen reader compatibility',
        'Test color contrast ratios',
        'Validate ARIA labels and roles',
      ],

      'Performance Monitoring': [
        'Measure page load times',
        'Monitor network requests',
        'Check for performance regressions',
        'Validate Core Web Vitals',
      ],
    };

    Object.entries(workflows).forEach(([category, tasks]) => {
      console.log(`\n📋 ${category}:`);
      tasks.forEach((task) => console.log(`   • ${task}`));
    });

    console.log('\n💡 Example MCP Commands:');
    console.log('   "Navigate to the admin page and verify the DEV badge is visible"');
    console.log('   "Take a screenshot of the dashboard and check if all tiles load"');
    console.log('   "Fill out the login form and submit it"');
    console.log('   "Wait for the page to load completely then extract any error messages"');
  }

  async showHelp() {
    console.log('\n🚀 Cable Platform Development Toolkit');
    console.log('=====================================');

    console.log('\nAvailable commands:');
    console.log('  check     - Check service availability');
    console.log('  screenshots - Generate screenshot instructions');
    console.log('  test      - Run all test suites');
    console.log('  lint      - Run code linting');
    console.log('  build     - Build all services');
    console.log('  workflows - Show MCP development workflows');
    console.log('  help      - Show this help');

    console.log('\nUsage: node scripts/dev-toolkit.js <command>');
    console.log('Example: node scripts/dev-toolkit.js check');
  }

  async run() {
    const command = process.argv[2];

    switch (command) {
      case 'check':
        await this.checkServices();
        break;
      case 'screenshots':
        await this.generateScreenshots();
        break;
      case 'test':
        await this.runTests();
        break;
      case 'lint':
        await this.lintCode();
        break;
      case 'build':
        await this.buildServices();
        break;
      case 'workflows':
        this.showMCPWorkflows();
        break;
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }
}

// Run the toolkit
const toolkit = new DevToolkit();
toolkit.run().catch(console.error);
