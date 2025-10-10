# MCP Playwright Server

This service provides Microsoft Playwright MCP (Model Context Protocol) server support for AI-assisted web testing and automation.

## Overview

The Playwright MCP server allows AI assistants to interact with web browsers through Playwright, enabling automated testing, web scraping, and UI interaction capabilities.

## Features

- **Browser Automation**: Navigate, click, type, and interact with web pages
- **Screenshot Capture**: Take screenshots of pages or specific elements
- **Element Inspection**: Get text content and wait for elements
- **MCP Protocol**: Full Model Context Protocol support for AI integration

## Installation

```bash
cd services/mcp-playwright
pnpm install
```

## Usage

### Direct Execution

```bash
# Start the MCP server
pnpm run mcp

# Or use the wrapper
pnpm run dev
```

### With MCP Client

Configure your MCP client (like Claude Desktop) to use this server:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp", "mcp-server-playwright"],
      "cwd": "/path/to/cable-platform/services/mcp-playwright"
    }
  }
}
```

## Available Tools

The server provides the following tools through MCP:

- `playwright_navigate` - Navigate to a URL
- `playwright_screenshot` - Take a screenshot
- `playwright_click` - Click on elements
- `playwright_type` - Type text into inputs
- `playwright_get_text` - Extract text from elements
- `playwright_wait_for_selector` - Wait for elements to appear

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build the project
pnpm run build

# Run tests
pnpm run test

# Lint code
pnpm run lint
```

## Configuration

The server uses Playwright's default configuration. You can customize browser behavior by setting environment variables:

- `PLAYWRIGHT_BROWSERS_PATH` - Custom browser installation path
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` - Skip automatic browser download

## Requirements

- Node.js 18+
- Playwright browsers (automatically installed)

## Integration

This service integrates with the Cable Platform's testing infrastructure and can be used alongside existing Playwright tests in `apps/portal/tests/`.
