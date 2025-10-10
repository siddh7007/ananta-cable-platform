# Microsoft Playwright MCP Server Integration

This document describes the integration of Microsoft's Playwright MCP (Model Context Protocol) server into the Cable Platform.

## Overview

The Playwright MCP server enables AI assistants to interact with web browsers through Playwright, providing capabilities for:

- Automated web testing
- UI interaction and inspection
- Screenshot capture
- Element manipulation
- Cross-browser compatibility testing

## Architecture

```
┌─────────────────┐    MCP Protocol    ┌──────────────────────┐
│   AI Assistant  │◄──────────────────►│  MCP Playwright      │
│   (Claude, etc) │                    │  Server              │
└─────────────────┘                    └──────────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────────┐
                                   │   Playwright         │
                                   │   Browser Automation │
                                   └──────────────────────┘
```

## Installation

The MCP Playwright server is installed as a workspace service:

```bash
cd services/mcp-playwright
pnpm install
```

## Configuration

### MCP Client Configuration

To use the Playwright MCP server with an MCP client (like Claude Desktop), add this configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp", "mcp-server-playwright"],
      "cwd": "/path/to/cable-platform/services/mcp-playwright",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Environment Variables

The server supports various Playwright configuration options:

- `PLAYWRIGHT_BROWSERS_PATH` - Custom browser installation path
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` - Skip automatic browser download
- `NODE_ENV` - Environment (development/production)

## Available Tools

The MCP server provides these tools to AI assistants:

### Navigation & Interaction

- **Navigate**: Load URLs in the browser
- **Click**: Click on page elements
- **Type**: Enter text into form fields
- **Wait**: Wait for elements to appear

### Inspection & Capture

- **Screenshot**: Capture page or element screenshots
- **Get Text**: Extract text content from elements
- **Get HTML**: Retrieve page HTML structure

### Browser Control

- **New Page**: Open new browser tabs/pages
- **Close Page**: Close browser tabs/pages
- **Evaluate**: Execute JavaScript in page context

## Usage Examples

### Basic Navigation

```javascript
// AI assistant can navigate to pages
await playwright.navigate('https://example.com');
```

### Form Interaction

```javascript
// Fill out and submit forms
await playwright.type('#username', 'testuser');
await playwright.type('#password', 'testpass');
await playwright.click('#login-button');
```

### Visual Testing

```javascript
// Take screenshots for comparison
const screenshot = await playwright.screenshot();
```

### Element Inspection

```javascript
// Extract data from pages
const title = await playwright.getText('h1');
const links = await playwright.evaluate(
  "() => Array.from(document.querySelectorAll('a')).map(a => a.href)",
);
```

## Integration with Cable Platform

### Testing Integration

The MCP server integrates with the existing Playwright test suite in `apps/portal/tests/`:

- **Shared Browser Setup**: Uses same browser configuration as portal tests
- **Test Data Access**: Can access test fixtures and mock data
- **CI/CD Integration**: Works with existing test pipelines

### Development Workflow

1. **Local Development**: Run MCP server for manual testing
2. **AI-Assisted Testing**: Use AI to generate and execute tests
3. **Debugging**: AI can inspect page state and take screenshots
4. **Regression Testing**: Automated test execution and validation

## Security Considerations

- **Host Restrictions**: Configure allowed hosts to prevent unauthorized access
- **Sandbox Mode**: Run in sandboxed environment for security
- **Permission Grants**: Explicitly grant required browser permissions
- **Session Isolation**: Use isolated sessions to prevent data leakage

## Performance Optimization

- **Headless Mode**: Run browsers headlessly for better performance
- **Browser Reuse**: Reuse browser instances across sessions
- **Resource Limits**: Configure timeouts and resource constraints
- **Caching**: Cache browser downloads and dependencies

## Troubleshooting

### Common Issues

1. **Browser Not Found**

   ```bash
   # Install browsers manually
   npx playwright install
   ```

2. **Port Conflicts**

   ```bash
   # Specify custom port
   npx @playwright/mcp mcp-server-playwright --port 3001
   ```

3. **Permission Errors**
   ```bash
   # Run with proper permissions
   npx @playwright/mcp mcp-server-playwright --no-sandbox
   ```

### Debug Mode

Enable debug logging:

```bash
DEBUG=pw:* npx @playwright/mcp mcp-server-playwright
```

## Development

### Building

```bash
cd services/mcp-playwright
pnpm run build
```

### Testing

```bash
cd services/mcp-playwright
pnpm run test
```

### Local Development

```bash
cd services/mcp-playwright
pnpm run dev  # Runs the wrapper
pnpm run mcp  # Runs MCP server directly
```

## Future Enhancements

- **Custom Tool Development**: Add domain-specific tools for Cable Platform
- **Test Generation**: AI-powered test case generation
- **Visual Regression**: Automated visual comparison testing
- **Performance Monitoring**: Integration with observability stack
- **Multi-Browser Support**: Enhanced cross-browser testing capabilities

## References

- [Playwright MCP Documentation](https://playwright.dev/docs/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Playwright Official Site](https://playwright.dev/)
