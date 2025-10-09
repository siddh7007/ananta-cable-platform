import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      DEV_AUTH_BYPASS: 'true',
      AUTH0_DOMAIN: 'test.auth0.com',
      AUTH0_AUDIENCE: 'test-audience'
    }
  },
})