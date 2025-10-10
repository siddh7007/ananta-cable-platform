<script lang="ts">
  import type { PageData } from './$types';
  import type { AdminUser } from '$lib/types/admin';

  export let data: PageData;

  let searchQuery = data.search || '';
  let users = data.usersResponse.users;
  let total = data.usersResponse.total;
  let limit = data.limit;
  let offset = data.offset;

  // Placeholder functions - replace with real API calls later
  async function handleSearch() {
    // Placeholder: In real implementation, this would trigger a page reload with search params
    console.log('Search triggered:', searchQuery);
    // For now, just update the URL to trigger the load function
    const url = new URL(window.location.href);
    if (searchQuery) {
      url.searchParams.set('search', searchQuery);
    } else {
      url.searchParams.delete('search');
    }
    url.searchParams.set('offset', '0'); // Reset pagination on search
    window.location.href = url.toString();
  }

  async function handleDeactivateUser(userId: string) {
    // Placeholder: In real implementation, this would call the API
    console.log('Deactivate user:', userId);
    alert(`Placeholder: Deactivate user ${userId} - API call not implemented yet`);
  }

  async function handleReactivateUser(userId: string) {
    // Placeholder: In real implementation, this would call the API
    console.log('Reactivate user:', userId);
    alert(`Placeholder: Reactivate user ${userId} - API call not implemented yet`);
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusBadge(status: string) {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }
</script>

<svelte:head>
  <title>Admin - User Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
    <p class="text-gray-600">Manage platform users, their roles, and access status.</p>
  </div>

  <!-- Search Section -->
  <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
    <div class="flex gap-4 items-end">
      <div class="flex-1">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
          Search Users
        </label>
        <input
          id="search"
          type="text"
          bind:value={searchQuery}
          placeholder="Search by name, email, or role..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          on:keydown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      <button
        on:click={handleSearch}
        class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Search
      </button>
    </div>
  </div>

  <!-- Results Summary -->
  <div class="mb-4 text-sm text-gray-600">
    Showing {users.length} of {total} users
    {#if searchQuery}
      <span>for "{searchQuery}"</span>
    {/if}
  </div>

  <!-- Users Table -->
  <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              User
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Roles
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Created
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each users as user (user.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{user.name}</div>
                    <div class="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-wrap gap-1">
                  {#each user.roles as role}
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role}
                    </span>
                  {/each}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusBadge(
                    user.status,
                  )}"
                >
                  {user.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(user.createdAt)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {#if user.status === 'active'}
                  <button
                    on:click={() => handleDeactivateUser(user.id)}
                    class="text-red-600 hover:text-red-900 mr-4 transition-colors"
                  >
                    Deactivate
                  </button>
                {:else}
                  <button
                    on:click={() => handleReactivateUser(user.id)}
                    class="text-green-600 hover:text-green-900 mr-4 transition-colors"
                  >
                    Reactivate
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if users.length === 0}
      <div class="text-center py-12">
        <div class="text-gray-500 text-lg mb-2">No users found</div>
        <div class="text-gray-400 text-sm">
          {#if searchQuery}
            Try adjusting your search terms
          {:else}
            No users available
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Pagination (placeholder) -->
  {#if total > limit}
    <div class="mt-6 flex justify-center">
      <div class="text-sm text-gray-500">Pagination controls would go here (placeholder)</div>
    </div>
  {/if}
</div>
