"use client";

import React from "react";
import { User, MapPin, CalendarClock } from "lucide-react";
import { formatDate, titleCase } from "@/utils/funtions";

export interface Employee {
	name: string;
	email: string;
	mode: "On Site" | "Remote" | "Hybrid";
	status: "present" | "leave" | "movement";
	designation: string;
	department: string;
	location: string;
}

interface EmployeeCardProps {
	employee: Employee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
	const isPresent = employee.status === "present";
	const isMovement = employee.status === "movement";

	// color styles for each mode badge
	const modeStyles: Record<Employee["mode"], string> = {
		"On Site": "bg-green-100 text-green-800",
		Remote: "bg-blue-100 text-blue-800",
		Hybrid: "bg-yellow-100 text-yellow-800",
	};
	const badgeClass = modeStyles[employee.mode];

	return (
		<div className="relative border border-gray-300  rounded-xl p-4 flex flex-col gap-2">
			<div className="flex items-center justify-between">
				{/* slow-glow status dot */}
				<span
					className={`absolute top-4 right-4 inline-block h-3 w-3 rounded-lg ring-2 ${
						isPresent
							? "bg-green-500 ring-green-500/50 animate-[pulse_3s_ease-in-out_infinite]"
							: isMovement
							? "bg-blue-500 ring-blue-500/50 animate-[pulse_3s_ease-in-out_infinite]"
							: "bg-red-500 ring-red-500/50 animate-[pulse_3s_ease-in-out_infinite]"
					}`}
				/>

				<div className="mt-2">
					<span
						className={`inline-block absolute top-4 left-4  bg-gray-100 px-2 py-0.5 text-xs font-medium rounded-lg ${badgeClass}`}
					>
						{titleCase(employee?.mode)}
					</span>
				</div>
			</div>

			{/* avatar + name */}
			<div className="flex items-center pt-3 gap-3">
				<div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
					<User className="size-5 text-gray-500" />
				</div>
				<h4 className="text-md font-bold text-gray-800">
					{titleCase(employee?.name)}
				</h4>
			</div>

			{/* designation */}
			<div className="flex items-center gap-2 text-sm text-gray-600">
				<CalendarClock className="size-4" />
				<span className="text-xs ">
					{formatDate(employee?.designation)}
				</span>
			</div>

			{/* location */}
			<div className="flex items-center gap-2 text-sm text-gray-600">
				<MapPin className="size-4" />
				<span className="text-xs ">
					{titleCase(employee?.location)}
				</span>
			</div>

			{/* mode badge */}
		</div>
	);
}
