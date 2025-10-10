# MCP Development Workflows

This guide shows how to use the Microsoft Playwright MCP server to streamline Cable Platform development workflows.

## 🚀 Quick Start

1. **Start MCP Server:**

   ```bash
   cd services/mcp-playwright
   pnpm run mcp
   ```

2. **Configure MCP Client:**
   - Use `mcp-config.json` in Claude Desktop or your MCP client
   - The server will be available as "playwright" in your MCP client

3. **Start Developing:**
   - Ask your AI assistant to perform development tasks
   - Use the workflows below as examples

## 📋 Development Workflows

### 1. UI Component Testing

**Goal:** Verify UI components work correctly across the application

**MCP Commands:**

```
"Navigate to http://localhost:5174 and verify the sidebar loads with all navigation items"
"Click on the Admin link in the sidebar and check if the DEV badge appears"
"Test the responsive design by setting viewport to 768px width"
"Take a screenshot of the admin dashboard and verify all cards are visible"
```

**Benefits:**

- Instant visual verification of UI changes
- Cross-browser compatibility testing
- Responsive design validation
- Screenshot documentation

### 2. Form Validation & Testing

**Goal:** Test form interactions and data submission

**MCP Commands:**

```
"Navigate to the admin section and try to access without proper authentication"
"Fill out any forms on the page with test data and submit them"
"Verify error messages appear when invalid data is entered"
"Test keyboard navigation through form fields"
```

**Benefits:**

- Automated form testing
- Validation logic verification
- Accessibility testing
- Error handling validation

### 3. User Journey Testing

**Goal:** Test complete user workflows end-to-end

**MCP Commands:**

```
"Start at the dashboard, navigate through projects → quotes → orders"
"Simulate a complete user workflow from login to checkout"
"Verify breadcrumbs and navigation state throughout the journey"
"Check that all expected elements load at each step"
```

**Benefits:**

- End-to-end workflow validation
- Navigation flow testing
- State management verification
- User experience validation

### 4. Visual Regression Testing

**Goal:** Detect unintended visual changes

**MCP Commands:**

```
"Take baseline screenshots of all main pages"
"Compare current screenshots with previous versions"
"Flag any visual differences or layout shifts"
"Generate a visual diff report for the team"
```

**Benefits:**

- Automated visual testing
- Change detection
- Documentation updates
- Quality assurance

### 5. Performance Monitoring

**Goal:** Monitor application performance

**MCP Commands:**

```
"Navigate to the dashboard and measure page load time"
"Monitor network requests and identify slow-loading resources"
"Check for JavaScript errors in the browser console"
"Test performance on different network conditions"
```

**Benefits:**

- Performance regression detection
- Load time monitoring
- Error detection
- Network optimization

### 6. Accessibility Testing

**Goal:** Ensure application accessibility

**MCP Commands:**

```
"Test keyboard navigation through the entire application"
"Check that all images have alt text and form fields have labels"
"Verify color contrast ratios meet WCAG standards"
"Test screen reader compatibility with ARIA labels"
```

**Benefits:**

- Accessibility compliance
- Inclusive design validation
- Legal compliance checking
- User experience improvement

## 🛠️ Development Toolkit

Use the development toolkit for common tasks:

```bash
# Check service availability
node scripts/dev-toolkit.js check

# Generate screenshot instructions
node scripts/dev-toolkit.js screenshots

# Run all tests
node scripts/dev-toolkit.js test

# Show MCP workflow examples
node scripts/dev-toolkit.js workflows
```

## 💡 MCP Command Patterns

### Navigation & Interaction

```
"Navigate to [URL] and wait for it to load completely"
"Click on the [element description] and verify [expected result]"
"Type '[text]' into the [field name] input field"
"Select '[option]' from the [dropdown name] dropdown"
```

### Content Verification

```
"Verify that [element] is visible on the page"
"Check that the page title contains '[expected text]'"
"Extract all error messages from the current page"
"Count how many [elements] are present on the page"
```

### Visual Testing

```
"Take a full page screenshot and save it as [filename]"
"Take a screenshot of the [element] and check its dimensions"
"Compare the current page with the baseline screenshot"
"Generate thumbnails of all main pages"
```

### Form Testing

```
"Fill out the [form name] with valid test data"
"Submit the form and verify the success message appears"
"Test form validation by entering invalid data"
"Verify that required fields show error messages when empty"
```

### Debugging & Monitoring

```
"Check the browser console for any JavaScript errors"
"Monitor network requests and identify slow responses"
"Extract the HTML source of the current page"
"Check if [element] has the expected CSS classes"
```

## 🔄 Integration with Development Process

### Daily Development

1. **Start MCP server** when beginning development work
2. **Test UI changes** immediately after implementing features
3. **Verify responsive design** across different viewports
4. **Document features** with screenshots
5. **Check accessibility** before committing changes

### Code Review Process

1. **Generate screenshots** of new features for reviewers
2. **Test user journeys** affected by changes
3. **Verify cross-browser compatibility**
4. **Check performance impact** of changes
5. **Validate accessibility improvements**

### Release Process

1. **Run comprehensive UI tests** before release
2. **Generate visual documentation** for release notes
3. **Verify critical user journeys** work correctly
4. **Check performance metrics** against baselines
5. **Validate accessibility compliance**

## 📊 Metrics & Monitoring

Track development efficiency with MCP:

- **Time to test UI changes:** Reduced from manual testing to instant AI-assisted verification
- **Bug detection rate:** Earlier identification of visual and interaction issues
- **Documentation quality:** Automated screenshot generation for features
- **Accessibility compliance:** Continuous validation during development
- **Cross-browser testing:** Automated verification across different browsers

## 🎯 Best Practices

### MCP Command Guidelines

- Be specific about elements: "Click the blue Save button" vs "Click save"
- Include expected results: "Click login and verify dashboard loads"
- Use descriptive selectors: "Click the 'Add Project' button in the header"
- Specify wait conditions: "Wait for the loading spinner to disappear"

### Development Workflow

- Start MCP server at the beginning of development sessions
- Test UI changes immediately after implementation
- Use screenshots for visual documentation and bug reports
- Include MCP testing in code review checklists
- Generate visual regression baselines before major changes

### Error Handling

- Check for JavaScript errors in console during testing
- Verify network requests complete successfully
- Test error states and edge cases
- Validate loading states and async operations

## 🚀 Advanced Usage

### Custom Test Scripts

Create reusable test scripts for common scenarios:

```javascript
// Example: Login test script
const loginTest = async () => {
  await playwright.navigate('http://localhost:5174/login');
  await playwright.type('#username', 'testuser');
  await playwright.type('#password', 'testpass');
  await playwright.click('#login-button');
  await playwright.waitForSelector('.dashboard');
  return 'Login successful';
};
```

### Integration Testing

Combine MCP with existing test suites:

```bash
# Run traditional tests
pnpm test

# Then use MCP for visual validation
# "Take screenshots of all pages and compare with baselines"
```

### CI/CD Integration

Add MCP testing to your pipeline:

```yaml
# Example GitHub Actions step
- name: MCP Visual Testing
  run: |
    npm install -g @playwright/mcp
    mcp-server-playwright &
    # Run MCP commands via API or client
```

## 📚 Resources

- [Playwright MCP Documentation](https://playwright.dev/docs/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cable Platform MCP Config](mcp-config.json)
- [Development Toolkit](scripts/dev-toolkit.js)

---

**Remember:** The MCP server makes development more efficient by providing instant, AI-assisted testing and validation capabilities. Use it throughout your development process to catch issues early and ensure quality. 🤖✨
