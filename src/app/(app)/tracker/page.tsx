// app/location/page.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { createRoot } from "react-dom/client";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FiSearch, FiFilter, FiMapPin } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Unit {
	id: string;
	name: string;
	coords: [number, number];
	employeeCount: number;
}
interface Site {
	id: string;
	name: string;
	coords: [number, number];
	units: Unit[];
}

// 3 dummy sites, each with 2 units and counts
const sites: Site[] = [
	{
		id: "site1",
		name: "Chennai HQ",
		coords: [80.248, 13.0827],
		units: [
			{
				id: "u1",
				name: "Unit A1",
				coords: [80.2485, 13.0832],
				employeeCount: 10,
			},
			{
				id: "u2",
				name: "Unit A2",
				coords: [80.2475, 13.0822],
				employeeCount: 12,
			},
		],
	},
	{
		id: "site2",
		name: "Bengaluru HQ",
		coords: [77.5946, 12.9716],
		units: [
			{
				id: "u3",
				name: "Unit B1",
				coords: [77.5951, 12.9721],
				employeeCount: 8,
			},
			{
				id: "u4",
				name: "Unit B2",
				coords: [77.5941, 12.9711],
				employeeCount: 14,
			},
		],
	},
	{
		id: "site3",
		name: "Mumbai HQ",
		coords: [72.8777, 19.076],
		units: [
			{
				id: "u5",
				name: "Unit C1",
				coords: [72.8782, 19.0765],
				employeeCount: 20,
			},
			{
				id: "u6",
				name: "Unit C2",
				coords: [72.8772, 19.0755],
				employeeCount: 15,
			},
		],
	},
];

export default function LocationPage() {
	const mapContainer = useRef<HTMLDivElement>(null);
	const [selectedSite, setSelectedSite] = useState<Site | null>(null);
	const [unitSearch, setUnitSearch] = useState("");

	// Initialize Mapbox map & markers
	useEffect(() => {
		if (!mapContainer.current) return;

		const map = new mapboxgl.Map({
			container: mapContainer.current,
			style: "mapbox://styles/mapbox/streets-v11",
			center: sites[0].coords,
			zoom: 4,
		});
		map.addControl(new mapboxgl.NavigationControl(), "top-right");

		map.on("load", () => {
			sites.forEach((site) => {
				const el = document.createElement("div");
				el.style.cursor = "pointer";
				const root = createRoot(el);

				root.render(
					<motion.div
						animate={{ y: [0, -8, 0] }}
						transition={{ duration: 1.2, repeat: Infinity }}
						className="flex items-center justify-center"
						onClick={() => {
							map.flyTo({
								center: site.coords,
								zoom: 10,
								speed: 1.2,
							});
							setSelectedSite(site);
						}}
					>
						<FaMapMarkerAlt
							size={32}
							className="text-red-600 drop-shadow-sm"
						/>
					</motion.div>
				);

				new mapboxgl.Marker(el).setLngLat(site.coords).addTo(map);
			});
		});

		return () => map.remove();
	}, []);

	// Filter units by search
	const filteredUnits = selectedSite
		? selectedSite.units.filter((u) =>
				u.name.toLowerCase().includes(unitSearch.toLowerCase())
		  )
		: [];

	return (
		<div className="flex h-[calc(100vh-4rem)]  w-full gap-4 p-4">
			{/* Map */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
				className="flex-1 rounded-lg overflow-hidden border border-gray-300 shadow-sm"
			>
				<div ref={mapContainer} className="w-full h-full" />
			</motion.div>

			{/* Right Panel */}
			<div className="w-full md:w-1/3 flex flex-col">
				<AnimatePresence>
					{selectedSite && (
						<motion.div
							key={selectedSite.id}
							initial={{ x: 60, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: 60, opacity: 0 }}
							transition={{ duration: 0.25 }}
							className="bg-white rounded-xl shadow-sm border border-gray-300 flex-1 flex flex-col overflow-hidden"
						>
							{/* Header */}
							<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
								<h2 className="text-xl font-semibold text-gray-800">
									{selectedSite.name}
								</h2>
								<button
									onClick={() => setSelectedSite(null)}
									className="p-2 text-gray-500 hover:text-gray-700 transition"
								>
									<AiOutlineClose size={20} />
								</button>
							</div>

							{/* Summary Bar */}
							<div className="flex items-center px-6 py-3 border border-gray-100 space-x-4 bg-gray-50">
								<div className="flex items-center gap-2">
									<span className="text-gray-600">Units</span>
									<span className="text-indigo-600 font-semibold">
										{selectedSite.units.length}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-gray-600">
										Employees
									</span>
									<span className="text-indigo-600 font-semibold">
										{selectedSite.units.reduce(
											(sum, u) => sum + u.employeeCount,
											0
										)}
									</span>
								</div>
							</div>

							{/* Search & Filter */}
							<div className="flex items-center gap-2 px-6 py-4">
								<div className="relative flex-1">
									<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
									<input
										type="text"
										placeholder="Search units"
										value={unitSearch}
										onChange={(e) =>
											setUnitSearch(e.target.value)
										}
										className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
									/>
								</div>
								<button className="mx-auto border border-gray-300 bg-gradient-to-r from-[#243972] to-[#cd2125] rounded-lg hover:bg-gray-200 h-full w-10 felx items-center justify-center transition">
									<FiFilter className="text-gray-100 mx-auto" />
								</button>
							</div>

							{/* Unit Cards */}
							<motion.div
								className="flex-1 overflow-auto px-6 pt-2 pb-4"
								initial="hidden"
								animate="show"
								variants={{
									show: {
										transition: { staggerChildren: 0.05 },
									},
								}}
							>
								<div className="grid grid-cols-2 gap-4">
									{filteredUnits.map((unit) => (
										<motion.div
											key={unit.id}
											variants={{
												hidden: { opacity: 0, y: 10 },
												show: { opacity: 1, y: 0 },
											}}
											whileHover={{
												scale: 1.03,
												boxShadow:
													"0 2px 7px rgba(0,0,0,0.1)",
											}}
											className="bg-gray-50 p-4 border border-gray-300 rounded-lg cursor-pointer transition"
											onClick={() => {
												/* maybe drill into unit? */
											}}
										>
											<div className="text-gray-800 font-medium">
												{unit.name}
											</div>
											<div className="text-indigo-600 font-semibold mt-1">
												{unit.employeeCount} employees
											</div>
										</motion.div>
									))}
									{filteredUnits.length === 0 && (
										<div className="col-span-2 text-center text-gray-500 mt-4">
											No units found.
										</div>
									)}
								</div>
							</motion.div>
						</motion.div>
					)}

					{/* Empty State when no site is selected */}
					<AnimatePresence>
						{!selectedSite && (
							<motion.div
								key="empty"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.3 }}
								className="flex-1 flex items-center justify-center"
							>
								<motion.div
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ duration: 0.4 }}
									className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center text-center max-w-sm"
								>
									<motion.div
										animate={{ y: [0, -8, 0] }}
										transition={{
											duration: 1.5,
											repeat: Infinity,
										}}
										className="mb-4"
									>
										{/* Map icon */}
										<FiMapPin className="text-gray-300 size-12" />
									</motion.div>
									<h3 className="text-xl font-semibold text-gray-700 mb-2">
										No Site Selected
									</h3>
									<p className="text-gray-500 mb-4">
										Click any site marker on the map to see
										its details and units here.
									</p>
									{/* <button
										
										className="text-indigo-600 hover:underline"
									>
										Learn how this works
									</button> */}
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
				</AnimatePresence>
			</div>
		</div>
	);
}
