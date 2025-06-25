"use client";

import { useEffect, useState, useMemo } from "react";
import {
	FiSearch,
	FiPlus,
	FiChevronDown,
	FiChevronUp,
	FiUsers,
	FiMapPin,
} from "react-icons/fi";
import { Boxes } from "lucide-react";
import { BsBuildings } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Unit {
	id: number;
	name: string;
	employeeCount: number;
}

interface Site {
	id: number;
	name: string;
	units: Unit[];
}

interface UnitApi {
	unitId: number;
	unitName: string;
}

interface LocationApi {
	id: number;
	locationName: string;
	sfomfrUnits: UnitApi[];
}

export default function LocationsPage() {
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<number | null>(null);
	const [sites, setSites] = useState<Site[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		apiFetch<{ data: LocationApi[] }>("/RMv2/get-all-locations", {
			method: "GET",
		})
			.then((res) => {
				const mapped: Site[] = res.data.map((loc) => ({
					id: loc.id,
					name: loc.locationName,
					units: loc.sfomfrUnits.map((u) => ({
						id: u.unitId,
						name: u.unitName,
						employeeCount: 0, // TODO: Wire real count if needed
					})),
				}));
				setSites(mapped);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	const filteredSites = useMemo(
		() =>
			sites.filter((s) =>
				s.name.toLowerCase().includes(search.toLowerCase())
			),
		[search, sites]
	);

	const selectedSite = useMemo(
		() => filteredSites.find((s) => s.id === selected) ?? null,
		[filteredSites, selected]
	);

	return (
		<div className="flex flex-col pt-5 w-full">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 mb-4">
				<h1 className="text-xl sm:text-2xl font-bold text-gray-800">
					Locations
				</h1>
				<div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
					<div className="relative z-0 flex-1 sm:flex-none">
						<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search sites…"
							className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-full focus:ring-green-500 focus:outline-none transition"
						/>
					</div>
					<Link
						href="/location/create"
						className="flex items-center text-sm gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-full transition"
					>
						<FiPlus /> Create
					</Link>
				</div>
			</div>

			{/* Grid + Details */}
			<div className="flex flex-col lg:flex-row gap-4 px-4 sm:px-6">
				<div
					className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1`}
				>
					{loading ? (
						<div className="col-span-full text-center text-gray-500 py-10">
							Loading...
						</div>
					) : filteredSites.length > 0 ? (
						filteredSites.map((site) => {
							const isOpen = selected === site.id;
							return (
								<motion.div
									key={site.id}
									layout
									initial={{ opacity: 0, y: 5 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 5 }}
									transition={{ duration: 0.3 }}
									className="cursor-pointer"
									onClick={() =>
										setSelected((prev) =>
											prev === site.id ? null : site.id
										)
									}
								>
									<div className="rounded-xl shadow-xs border border-gray-300 overflow-hidden hover:shadow-sm group transition bg-white">
										<div className="flex relative items-center px-4 py-4">
											<div className="flex-shrink-0 bg-green-50 p-3 rounded-full">
												<FiMapPin className="text-green-600 size-6" />
											</div>
											<div className="ml-4 flex-1">
												<h2 className="text-gray-800 text-md font-semibold truncate">
													{site.name}
												</h2>
											</div>
											<div className="absolute bottom-2 right-2 flex bg-green-50 py-1 px-2 rounded-full items-center text-sm gap-1">
												<Boxes className="size-4 text-green-600" />
												{site.units.length} Units
											</div>
											<div className="ml-4 absolute top-1.5 right-1.5 flex items-center gap-2">
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
						})
					) : (
						<div className="col-span-full text-center text-gray-500 py-10">
							No sites found.
						</div>
					)}
				</div>

				<AnimatePresence>
					{selectedSite && (
						<motion.div
							key="details"
							initial={{ x: 20, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: 20, opacity: 0 }}
							transition={{ duration: 0.3 }}
							className="w-full lg:w-1/3 bg-white rounded-xl border border-gray-300"
						>
							<div className="flex items-center justify-between px-4 py-4">
								<h2 className="text-lg sm:text-xl font-semibold text-gray-800">
									{selectedSite.name}
								</h2>
								<button
									onClick={() => setSelected(null)}
									className="text-gray-500 hover:text-gray-700"
								>
									<FiChevronDown size={20} />
								</button>
							</div>
							<div className="p-4 pt-0 space-y-4">
								<h3 className="flex items-center justify-between text-base font-medium text-gray-800">
									<span>Units</span>
									<Link
										href={"/location/unit/create"}
										className="px-2 py-1 text-green-700 hover:text-green-800 border border-green-700 hover:border-green-800 rounded-full text-xs flex items-center gap-1"
									>
										<FiPlus /> Create Unit _{" "}
									</Link>
								</h3>
								<div className="space-y-2">
									{selectedSite.units.map((unit) => (
										<Link
											href={`location/unit/${unit.id}`}
											key={unit.id}
											className="flex items-center justify-between border border-gray-300 bg-gray-50 p-2 rounded-lg"
										>
											<div className="flex items-center gap-2">
												<BsBuildings className="text-green-600 size-5" />
												<span className="text-gray-800 text-sm font-medium">
													{unit.name}
												</span>
											</div>
											<div className="flex items-center gap-1 text-sm text-green-700">
												<FiUsers /> {unit.employeeCount}
											</div>
										</Link>
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
