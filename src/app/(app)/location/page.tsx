// app/locations/page.tsx
"use client";

import { useState, useMemo } from "react";
import {
	FiSearch,
	FiFilter,
	FiPlus,
	FiMapPin,
	FiUsers,
	FiChevronDown,
	FiChevronUp,
	FiEye,
} from "react-icons/fi";
import { Boxes, EditIcon } from "lucide-react";
import { BsBuildings } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Unit {
	id: string;
	name: string;
	employeeCount: number;
}
interface Site {
	id: string;
	name: string;
	units: Unit[];
}

// Dummy data
const sites: Site[] = [
	{
		id: "1",
		name: "Chennai HQ",
		units: [
			{ id: "u1", name: "Unit A1", employeeCount: 10 },
			{ id: "u2", name: "Unit A2", employeeCount: 12 },
		],
	},
	{
		id: "2",
		name: "Bengaluru Branch",
		units: [
			{ id: "u3", name: "Unit B1", employeeCount: 8 },
			{ id: "u4", name: "Unit B2", employeeCount: 14 },
		],
	},
	{
		id: "3",
		name: "Mumbai Office",
		units: [
			{ id: "u5", name: "Unit C1", employeeCount: 20 },
			{ id: "u6", name: "Unit C2", employeeCount: 15 },
		],
	},
	{
		id: "4",
		name: "Delhi Center",
		units: [
			{ id: "u7", name: "Unit D1", employeeCount: 5 },
			{ id: "u8", name: "Unit D2", employeeCount: 7 },
		],
	},
	{
		id: "5",
		name: "Hyderabad Hub",
		units: [
			{ id: "u9", name: "Unit E1", employeeCount: 11 },
			{ id: "u10", name: "Unit E2", employeeCount: 13 },
		],
	},
	{
		id: "6",
		name: "Pune Site",
		units: [
			{ id: "u11", name: "Unit F1", employeeCount: 4 },
			{ id: "u12", name: "Unit F2", employeeCount: 6 },
		],
	},
];

export default function LocationsPage() {
	const [search, setSearch] = useState("");
	const [filterOpen, setFilterOpen] = useState(false);
	const [selected, setSelected] = useState<string | null>(null);

	const filteredSites = useMemo(
		() =>
			sites.filter((s) =>
				s.name.toLowerCase().includes(search.toLowerCase())
			),
		[search]
	);

	return (
		<div className="flex flex-col w-full p-6 bg-gray-50">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
				<h1 className="text-2xl font-bold text-gray-800">Locations</h1>
				<div className="flex items-center gap-3 flex-wrap">
					<div className="relative">
						<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search sites..."
							className="w-64 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
						/>
					</div>
					<div className="relative">
						<button
							onClick={() => setFilterOpen((o) => !o)}
							className="p-2 bg-white border border-gray-300 text-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition"
						>
							<FiFilter /> Filter
						</button>
						<AnimatePresence>
							{filterOpen && (
								<motion.div
									initial={{ opacity: 0, y: -8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -8 }}
									transition={{ duration: 0.15 }}
									className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-gray-200 p-4 z-20"
								>
									<div className="flex flex-col gap-2">
										<label className="text-sm text-gray-700">
											Region
										</label>
										<select className="w-full border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500">
											<option>All</option>
											<option>South</option>
											<option>North</option>
										</select>
										<label className="text-sm text-gray-700">
											Size
										</label>
										<select className="w-full border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500">
											<option>All</option>
											<option>Small (&lt;10)</option>
											<option>Large (&gt;10)</option>
										</select>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
					<Link
						href={`/location/create`}
						onClick={() => {}}
						className="flex items-center gap-2 w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#243972] to-[#cd2125] hover:from-[#cd2125] hover:to-[#1f355f] text-white font-medium rounded-lg transition"
					>
						<FiPlus /> Create
					</Link>
				</div>
			</div>

			{/* Grid + Details */}
			<div className="flex gap-6">
				{/* Left: Grid */}
				<div
					className={`overflow-auto ${
						selected
							? "grid grid-cols-2 auto-rows-min gap-4"
							: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-min gap-4"
					}`}
				>
					{filteredSites.map((site) => {
						const isOpen = selected === site.id;
						return (
							<motion.div
								key={site.id}
								layout
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 10 }}
								transition={{ duration: 0.3 }}
								className="cursor-pointer"
								onClick={() =>
									setSelected((prev) =>
										prev === site.id ? null : site.id
									)
								}
							>
								<div className="rounded-xl shadow-xs border border-gray-300 overflow-hidden hover:shadow-sm group transition">
									<div className="flex items-center px-6 py-4 bg-white">
										<div className="flex-shrink-0 bg-green-50 p-3 rounded-full">
											<FiMapPin className="text-green-600 size-6" />
										</div>
										<div className="ml-4 flex-1">
											<h2 className="text-gray-800 text-lg font-semibold">
												{site.name}
											</h2>
											<div className="flex items-center mt-1 text-sm text-gray-600 gap-4">
												<div className="flex items-center gap-1">
													<Boxes className="size-4" />
													{site.units.length} Units
												</div>
												<div className="flex items-center gap-1">
													<FiUsers className="size-4" />
													{site.units.reduce(
														(sum, u) =>
															sum +
															u.employeeCount,
														0
													)}{" "}
													Employees
												</div>
											</div>
										</div>
										<div className="ml-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
											{isOpen ? (
												<FiChevronUp className="text-gray-500 size-6" />
											) : (
												<FiChevronDown className="text-gray-500 size-6" />
											)}
										</div>
									</div>
								</div>
							</motion.div>
						);
					})}

					{filteredSites.length === 0 && (
						<div className="col-span-full text-center text-gray-500 py-10">
							No sites found.
						</div>
					)}
				</div>

				{/* Right: Details panel */}
				<AnimatePresence>
					{selected && (
						<motion.div
							key="details"
							initial={{ x: 20, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: 20, opacity: 0 }}
							transition={{ duration: 0.3 }}
							className="w-1/3 bg-white rounded-lg border border-gray-300"
						>
							<div className="flex items-center justify-between px-6 py-4">
								<h2 className="text-xl font-semibold text-gray-800">
									{
										filteredSites.find(
											(s) => s.id === selected
										)!.name
									}
								</h2>
								<button
									onClick={() => setSelected(null)}
									className="text-gray-500 hover:text-gray-700"
								>
									<FiChevronDown size={20} />
								</button>
							</div>
							<div className="p-6 pt-0  space-y-4">
								<div className="">
									<h3 className="flex items-center justify-between text-lg font-medium text-gray-800">
										<span>Units</span>
										<div className="flex items-center gap-4">
											<button className=" flex items-center border cursor-pointer border-gray-300 justify-center gap-2 px-4 py-2 bg-blue-50 text-gray-600-600 rounded-lg hover:bg-blue-100 transition">
												<FiEye />
											</button>
											<button className=" flex items-center border cursor-pointer border-gray-300 justify-center gap-2 px-4 py-2 bg-green-50 text-gray-600 rounded-lg hover:bg-green-100 transition">
												<EditIcon size={20} />
											</button>
										</div>
									</h3>
								</div>

								<div className="space-y-2">
									{filteredSites
										.find((s) => s.id === selected)!
										.units.map((unit) => (
											<div
												key={unit.id}
												className="flex items-center justify-between border border-gray-300 bg-gray-50 p-2 rounded-lg"
											>
												<div className="flex items-center gap-2">
													<BsBuildings className="text-green-600 size-5" />
													<span className="text-gray-800 text-sm font-medium">
														{unit.name}
													</span>
												</div>
												<div className="flex items-center gap-1 text-sm  text-green-700">
													<FiUsers />{" "}
													{unit.employeeCount}
												</div>
											</div>
										))}
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
