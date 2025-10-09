import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BFF_URL = process.env.BFF_PORTAL_URL || 'http://localhost:4001';

export const GET: RequestHandler = async ({ params }) => {
	const { draft_id } = params;

	if (!draft_id) {
		return error(400, { message: 'draft_id is required' });
	}

	try {
		const response = await fetch(`${BFF_URL}/api/synthesis/propose/${draft_id}`, {
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			if (response.status === 404) {
				return error(404, { message: 'Draft not found' });
			}
			return error(response.status, { message: `Failed to generate synthesis proposal: ${response.statusText}` });
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Error generating synthesis proposal:', err);
		return error(500, { message: 'Internal server error' });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	const { draft_id } = params;

	if (!draft_id) {
		return error(400, { message: 'draft_id is required' });
	}

	try {
		const body = await request.json();
		const { locks } = body;

		const response = await fetch(`${BFF_URL}/api/synthesis/recompute/${draft_id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ locks })
		});

		if (!response.ok) {
			return error(response.status, { message: `Failed to recompute synthesis: ${response.statusText}` });
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Error recomputing synthesis:', err);
		return error(500, { message: 'Internal server error' });
	}
};
