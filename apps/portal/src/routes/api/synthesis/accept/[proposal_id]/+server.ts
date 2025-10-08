import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BFF_URL = process.env.BFF_PORTAL_URL || 'http://localhost:4001';

export const POST: RequestHandler = async ({ params, request }) => {
	const { proposal_id } = params;

	if (!proposal_id) {
		return error(400, { message: 'proposal_id is required' });
	}

	try {
		const body = await request.json();
		const { locks } = body;

		const response = await fetch(`${BFF_URL}/api/synthesis/accept/${proposal_id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ locks })
		});

		if (!response.ok) {
			return error(response.status, { message: `Failed to accept synthesis: ${response.statusText}` });
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Error accepting synthesis:', err);
		return error(500, { message: 'Internal server error' });
	}
};
