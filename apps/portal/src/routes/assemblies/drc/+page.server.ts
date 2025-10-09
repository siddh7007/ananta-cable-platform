import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BFF_URL = process.env.BFF_PORTAL_URL || 'http://localhost:4001';

export const load: PageServerLoad = async ({ url }) => {
	const assemblyId = url.searchParams.get('assembly_id');

	if (!assemblyId) {
		return {
			drcReport: null,
			error: null
		};
	}

	try {
		const response = await fetch(`${BFF_URL}/api/assemblies/${assemblyId}/drc`, {
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 404) {
			// No DRC report exists yet - this is normal
			return {
				drcReport: null,
				assemblyId,
				error: null
			};
		}

		if (!response.ok) {
			console.error(`Failed to fetch DRC report: ${response.statusText}`);
			return {
				drcReport: null,
				assemblyId,
				error: `Failed to load DRC report: ${response.statusText}`
			};
		}

		const data = await response.json();
		return {
			drcReport: data,
			assemblyId,
			error: null
		};
	} catch (err) {
		console.error('Error loading DRC report:', err);
		return {
			drcReport: null,
			assemblyId,
			error: 'Failed to connect to server'
		};
	}
};
