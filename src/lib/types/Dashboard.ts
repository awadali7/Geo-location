// src/types/api.ts
export interface ApiResponse<T> {
	type: number;
	message: string;
	data: T;
}

export interface Department {
	id: number;
	dCode: string;
	dName: string;
	createdBy: string;
	createdOn: string;
	modifiedOn: string | null;
	modifiedBy: string | null;
}
