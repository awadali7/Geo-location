"use client";
import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { titleCase } from "@/utils/funtions";

export interface Employee {
	name: string;
}

interface EmployeeSearchProps {
	employees: Employee[];
	searchTerm: string;
	setSearchTerm: (term: string) => void;
}

export default function EmployeeSearch({
	employees,
	searchTerm,
	setSearchTerm,
}: EmployeeSearchProps) {
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	// close dropdown on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const suggestions = searchTerm
		? employees.filter((emp) =>
				emp.name.toLowerCase().includes(searchTerm.toLowerCase())
		  )
		: [];

	return (
		<div ref={wrapperRef} className="relative flex-1 min-w-[200px]">
			<div className="relative group">
				<span className="absolute inset-y-0 left-3 flex items-center text-gray-400 group-focus-within:text-indigo-600 transition-colors">
					<Search className="size-5" />
				</span>
				<input
					type="text"
					placeholder="Search employees"
					className="
            w-full h-10 rounded-full bg-gray-50 pl-10  text-sm border border-gray-300 pr-4 text-gray-700 placeholder-gray-500
            focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-shadow
          "
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
				/>
			</div>

			{open && suggestions.length > 0 && (
				<ul className="absolute top-full left-0 w-full bg-white border border-t-0 border-gray-200 rounded-b-lg shadow-lg max-h-60 overflow-y-auto z-20">
					{suggestions.map((emp) => (
						<li
							key={emp.name}
							onMouseDown={() => {
								setSearchTerm(emp.name);
								setOpen(false);
							}}
							className="
                px-4 py-2 cursor-pointer 
                hover:bg-indigo-100 hover:text-indigo-900
                transition-colors
              "
						>
							{titleCase(emp.name)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
