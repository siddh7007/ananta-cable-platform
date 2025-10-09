import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BFF_URL = process.env.BFF_PORTAL_URL || 'http://localhost:4001';

export const GET: RequestHandler = async ({ params }) => {
	const { assembly_id } = params;

	if (!assembly_id) {
		return error(400, { message: 'assembly_id is required' });
	}

	try {
		const response = await fetch(`${BFF_URL}/api/assemblies/${assembly_id}/drc`, {
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			if (response.status === 404) {
				return error(404, { message: 'DRC report not found' });
			}
			return error(response.status, { message: `Failed to fetch DRC report: ${response.statusText}` });
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Error fetching DRC report:', err);
		return error(500, { message: 'Internal server error' });
	}
};

export const POST: RequestHandler = async ({ params }) => {
	const { assembly_id } = params;

	if (!assembly_id) {
		return error(400, { message: 'assembly_id is required' });
	}

	try {
		const response = await fetch(`${BFF_URL}/api/assemblies/${assembly_id}/drc`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			return error(response.status, { message: `Failed to run DRC: ${response.statusText}` });
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		console.error('Error running DRC:', err);
		return error(500, { message: 'Internal server error' });
	}
};
