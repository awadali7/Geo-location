"use client";
import React from "react";

export interface FilterSelectProps {
	placeholder: string;
	options: string[];
	value: string;
	onChange: (value: string) => void;
}

export default function FilterSelect({
	placeholder,
	options,
	value,
	onChange,
}: FilterSelectProps) {
	return (
		<select
			className="bg-gray-50 border border-gray-300 text-gray-900 rounded-xl p-2 transition-all duration-200 hover:border-gray-400 focus:outline-none focus:shadow-md focus:ring-2 focus:ring-indigo-600 cursor-pointer"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		>
			{options.length === 0 && (
				<option value="" disabled>
					Loading...
				</option>
			)}
			{placeholder && (
				<option value="" disabled>
					{placeholder}
				</option>
			)}
			{options.map((opt) => (
				<option key={opt} value={opt}>
					{opt}
				</option>
			))}
		</select>
	);
}
