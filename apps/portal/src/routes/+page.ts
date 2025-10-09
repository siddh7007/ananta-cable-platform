import type { Load } from '@sveltejs/kit';

export type HealthStatus = 'ok' | 'degraded' | 'fail';

export interface HealthData {
  status: HealthStatus;
  version?: string;
}

export interface Project {
  id: string;
  name: string;
  updatedAt?: string;
}

export interface Quote {
  id: string;
  projectId?: string;
  total?: number;
  createdAt?: string;
}

export interface Order {
  id: string;
  quoteId?: string;
  status?: string;
  createdAt?: string;
}

export interface DashboardData {
  health: HealthData;
  projects: Project[];
  quotes: Quote[];
  orders: Order[];
}

/**
 * Fetch system health from /ready endpoint
 */
async function fetchHealth(baseUrl: string): Promise<HealthData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/ready`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { status: 'fail' };
    }

    const data = await response.json();
    
    // Map the status from the ready endpoint
    if (data.status === 'ok') {
      return {
        status: 'ok',
        version: data.version
      };
    } else if (data.status === 'degraded') {
      return {
        status: 'degraded',
        version: data.version
      };
    } else {
      return { status: 'fail' };
    }
  } catch (error) {
    console.error('Failed to fetch health:', error);
    return { status: 'fail' };
  }
}

/**
 * Fetch recent projects
 */
async function fetchRecentProjects(baseUrl: string): Promise<Project[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/v1/dashboard/projects/recent`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Failed to fetch projects:', response.status);
      return [];
    }

    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }
}

/**
 * Fetch latest quotes
 */
async function fetchLatestQuotes(baseUrl: string): Promise<Quote[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/v1/dashboard/quotes/latest`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Failed to fetch quotes:', response.status);
      return [];
    }

    const data = await response.json();
    return data.quotes || [];
  } catch (error) {
    console.error('Failed to fetch quotes:', error);
    return [];
  }
}

/**
 * Fetch recent orders
 */
async function fetchRecentOrders(baseUrl: string): Promise<Order[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/v1/dashboard/orders/recent`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Failed to fetch orders:', response.status);
      return [];
    }

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

/**
 * SSR load function for dashboard page
 * Fetches all dashboard data in parallel
 * Never throws - returns safe defaults on error
 */
export const load: Load = async ({ fetch: svelteKitFetch }) => {
  // Use environment variable for base URL, fallback to localhost
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  // Fetch all data in parallel
  const [health, projects, quotes, orders] = await Promise.all([
    fetchHealth(baseUrl),
    fetchRecentProjects(baseUrl),
    fetchLatestQuotes(baseUrl),
    fetchRecentOrders(baseUrl)
  ]);

  const dashboardData: DashboardData = {
    health,
    projects,
    quotes,
    orders
  };

  return dashboardData;
};
