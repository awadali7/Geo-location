// components/EmployeeCardSkeleton.tsx
import React from "react";

export const EmployeeCardSkeleton: React.FC = () => (
	<div className="animate-pulse bg-white shadow-md rounded-2xl p-6 flex flex-col gap-3">
		<span className="h-3 w-3 rounded-lg bg-gray-200 self-end" />
		<span className="h-6 w-16 bg-gray-200 rounded-lg" />
		<div className="flex items-center gap-3 pt-4">
			<div className="h-10 w-10 rounded-lg bg-gray-200" />
			<div className="h-4 w-24 bg-gray-200 rounded" />
		</div>
		<div className="h-3 w-32 bg-gray-200 rounded mt-2" />
		<div className="h-3 w-20 bg-gray-200 rounded" />
	</div>
);
