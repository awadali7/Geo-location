"use client";
import React from "react";

export interface FilterLocationProps {
	placeholder: string;
	options: string[];
	value: string;
	onChange: (value: string) => void;
}

export default function FilterLocation({
	placeholder,
	options,
	value,
	onChange,
}: FilterLocationProps) {
	return (
		<select
			className="bg-gray-50 border w-full border-gray-300 text-gray-900 rounded-xl p-2 transition-all duration-200 hover:border-gray-400 focus:outline-none focus:shadow-md focus:ring-2 focus:ring-indigo-600 cursor-pointer"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		>
			<option value="">{placeholder}</option>
			{options.map((opt) => (
				<option key={opt} value={opt}>
					{opt}
				</option>
			))}
		</select>
	);
}
