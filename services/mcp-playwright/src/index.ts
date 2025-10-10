#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the official Playwright MCP server
const playwrightMCP = spawn('npx', ['@playwright/mcp', 'mcp-server-playwright'], {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
  shell: true,
});

playwrightMCP.on('error', (error) => {
  console.error('Failed to start Playwright MCP server:', error);
  process.exit(1);
});

playwrightMCP.on('exit', (code) => {
  console.log(`Playwright MCP server exited with code ${code}`);
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Playwright MCP server...');
  playwrightMCP.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down Playwright MCP server...');
  playwrightMCP.kill('SIGTERM');
});

console.error('Playwright MCP Server wrapper started');
