import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const BFF_URL = process.env.BFF_PORTAL_URL || 'http://localhost:4001';

export const load: PageServerLoad = async ({ url }) => {
	const draftId = url.searchParams.get('draft_id');

	if (!draftId) {
		return {
			proposal: null,
			error: null
		};
	}

	try {
		const response = await fetch(`${BFF_URL}/api/synthesis/propose/${draftId}`, {
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 404) {
			return {
				proposal: null,
				draftId,
				error: 'Draft not found'
			};
		}

		if (!response.ok) {
			console.error(`Failed to generate synthesis proposal: ${response.statusText}`);
			return {
				proposal: null,
				draftId,
				error: `Failed to generate synthesis proposal: ${response.statusText}`
			};
		}

		const data = await response.json();
		return {
			proposal: data,
			draftId,
			error: null
		};
	} catch (err) {
		console.error('Error generating synthesis proposal:', err);
		return {
			proposal: null,
			draftId,
			error: 'Failed to connect to server'
		};
	}
};
