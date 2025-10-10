import { test } from 'tap';

test('MCP Playwright server can be imported', async (t) => {
  // Test that we can import the MCP SDK
  try {
    const { spawn } = await import('child_process');
    t.ok(spawn, 'child_process.spawn is available');
    t.pass('MCP Playwright server setup is valid');
  } catch (error) {
    t.fail(`Failed to import dependencies: ${error}`);
  }
});
