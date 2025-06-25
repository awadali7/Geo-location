// components/ui/FilterDept.tsx
"use client";

import React from "react";

export interface FilterDeptProps {
	options: { id: number; dName: string }[];
	value?: number;
	onChange: (value: number) => void;
}

export default function FilterDept({
	options,
	value,
	onChange,
}: FilterDeptProps) {
	return (
		<select
			className="
        bg-gray-50 border border-gray-300 text-gray-900 rounded-full p-2
        transition-all duration-200
        hover:border-gray-400
        focus:outline-none focus:shadow-md text-sm focus:ring-1 focus:ring-indigo-600
        cursor-pointer
      "
			value={value}
			onChange={(e) => onChange(Number(e.target.value))}
		>
			{options.map((dept) => (
				<option className="text-sm" key={dept.id} value={dept.id}>
					{dept.dName}
				</option>
			))}
		</select>
	);
}
