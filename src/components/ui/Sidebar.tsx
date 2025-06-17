"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
	Home,
	Users,
	User,
	UserPlus,
	CalendarCheck,
	CalendarX,
	MapPin,
	ChevronDown,
	LocateFixed,
} from "lucide-react";

interface SubMenuItem {
	key: string;
	label: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	href: string;
}

interface MenuItem {
	key: string;
	label: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	href?: string;
	children?: SubMenuItem[];
}

const menuConfig: MenuItem[] = [
	{
		key: "dashboard",
		label: "Dashboard",
		icon: Home,
		href: "/dashboard",
	},
	{
		key: "users",
		label: "Users",
		icon: Users,
		children: [
			{
				key: "deptHead",
				label: "Dept Head",
				icon: User,
				href: "/users/department-head",
			},
			{
				key: "teamLead",
				label: "Team Lead",
				icon: UserPlus,
				href: "/users/team-lead",
			},
			{ key: "team", label: "Team", icon: Users, href: "/users/team" },
		],
	},
	{
		key: "attendance",
		label: "Attendance",
		icon: CalendarCheck,
		children: [
			{
				key: "present",
				label: "Present",
				icon: CalendarCheck,
				href: "/attendance/present",
			},
			{
				key: "leave",
				label: "Leave",
				icon: CalendarX,
				href: "/attendance/leave",
			},
		],
	},

	{
		key: "tracker",
		label: "Tracker",
		icon: LocateFixed,
		href: "/tracker",
	},
	{
		key: "location",
		label: "Location",
		icon: MapPin,
		href: "/location",
	},
];

export default function Sidebar() {
	const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

	const toggleMenu = (key: string): void => {
		setOpenMenus((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	return (
		<aside
			className={[
				"w-64",
				"bg-gray-50",
				"border-r border-gray-200",
				"h-screen",
				"p-4",
				"flex flex-col",
			].join(" ")}
		>
			<nav className="flex-1 overflow-y-auto">
				<ul className="space-y-2">
					{menuConfig.map((item) => {
						const Icon = item.icon;
						const hasChildren = Boolean(
							item.children && item.children.length
						);

						return (
							<li key={item.key}>
								{hasChildren && item.children ? (
									<>
										<button
											onClick={() => toggleMenu(item.key)}
											className={[
												"flex w-full items-center justify-between",
												"p-2 rounded hover:bg-gray-100 transition-colors",
											].join(" ")}
											type="button"
										>
											<div className="flex items-center gap-3">
												<Icon className="size-5 text-gray-500" />
												<span className="font-medium text-gray-800">
													{item.label}
												</span>
											</div>
											<ChevronDown
												className={[
													"text-gray-500",
													"transition-transform duration-200",
													openMenus[item.key]
														? "rotate-180"
														: "",
												].join(" ")}
											/>
										</button>
										<ul
											className={[
												"pl-6 mt-1 overflow-hidden",
												"transition-[max-height] duration-300 ease-in-out",
												openMenus[item.key]
													? "max-h-40"
													: "max-h-0",
											].join(" ")}
										>
											{item.children.map((sub) => {
												const SubIcon = sub.icon;
												return (
													<li key={sub.key}>
														<Link
															href={sub.href}
															className={[
																"flex items-center gap-3 p-2 rounded",
																"hover:bg-gray-100 transition-colors",
															].join(" ")}
														>
															<SubIcon className="size-4 text-gray-400" />
															<span className="text-gray-700">
																{sub.label}
															</span>
														</Link>
													</li>
												);
											})}
										</ul>
									</>
								) : (
									<Link
										href={item.href || "#"}
										className={[
											"flex items-center gap-3",
											"p-2 rounded hover:bg-gray-100 transition-colors",
										].join(" ")}
									>
										<Icon className="size-5 text-gray-500" />
										<span className="font-medium text-gray-800">
											{item.label}
										</span>
									</Link>
								)}
							</li>
						);
					})}
				</ul>
			</nav>
		</aside>
	);
}
