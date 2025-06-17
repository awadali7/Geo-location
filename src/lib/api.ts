// src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface ApiError {
	message: string;
	status: number;
}

export async function apiFetch<T>(
	path: string,
	init: RequestInit = {}
): Promise<T> {
	const url = `${BASE}${path}`;
	const res = await fetch(url, {
		headers: { "Content-Type": "application/json", ...init.headers },
		...init,
	});
	if (!res.ok) {
		const text = await res.text();
		throw {
			message: text || res.statusText,
			status: res.status,
		} as ApiError;
	}
	return res.json() as Promise<T>;
}
