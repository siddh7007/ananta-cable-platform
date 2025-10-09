import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return new Response(
		JSON.stringify({
			status: 'ok',
			timestamp: new Date().toISOString(),
			service: 'portal'
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
};
