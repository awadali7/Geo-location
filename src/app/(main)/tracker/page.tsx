"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { createRoot } from "react-dom/client";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FiSearch, FiMapPin } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

// ✅ Types
interface LocationApi {
	id: number;
	locationName: string;
	lgt: number;
	lat: number;
	sfomfrUnits: UnitApi[];
}

interface UnitApi {
	unitId: number;
	unitName: string;
	lgt: number;
	lat: number;
}

interface Unit {
	id: number;
	name: string;
	coords: [number, number];
	employeeCount: number;
}

interface Site {
	id: number;
	name: string;
	coords: [number, number];
	units: Unit[];
}

export default function LocationPage() {
	const router = useRouter();
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const unitMarkers = useRef<mapboxgl.Marker[]>([]);

	const [sites, setSites] = useState<Site[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedSite, setSelectedSite] = useState<Site | null>(null);
	const [unitSearch, setUnitSearch] = useState("");

	// ✅ Fetch sites from API
	useEffect(() => {
		setLoading(true);
		apiFetch<{ data: LocationApi[] }>("/RMv2/get-all-locations")
			.then((res) => {
				const mapped: Site[] = res.data.map((loc) => ({
					id: loc.id,
					name: loc.locationName,
					coords: [loc.lgt, loc.lat],
					units: loc.sfomfrUnits.map((u) => ({
						id: u.unitId,
						name: u.unitName,
						coords: [u.lgt, u.lat],
						employeeCount: 0,
					})),
				}));
				setSites(mapped);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	// ✅ Init Map + Safe cleanup
	useEffect(() => {
		if (!mapContainer.current) return;

		// Clean up old map safely
		if (mapRef.current) {
			try {
				mapRef.current.remove();
			} catch (err) {
				console.warn("Safe map remove failed:", err);
			}
		}

		// Create new map
		const map = new mapboxgl.Map({
			container: mapContainer.current,
			style: "mapbox://styles/mapbox/streets-v11",
			center: sites[0]?.coords || [76.35, 10.0],
			zoom: 3,
		});

		map.addControl(new mapboxgl.NavigationControl(), "top-right");

		map.on("load", () => {
			sites.forEach((site) => {
				const siteEl = document.createElement("div");
				const siteRoot = createRoot(siteEl);
				siteRoot.render(
					<motion.div
						animate={{ y: [0, -8, 0] }}
						transition={{ duration: 1.2, repeat: Infinity }}
						className="flex items-center justify-center"
						onClick={() => {
							map.flyTo({
								center: site.coords,
								zoom: 10,
								speed: 1,
							});
							setSelectedSite(site);
							unitMarkers.current.forEach((m) => m.remove());
							unitMarkers.current = [];

							site.units.forEach((unit) => {
								const unitEl = document.createElement("div");
								const unitRoot = createRoot(unitEl);
								unitRoot.render(
									<motion.div
										animate={{ y: [0, -6, 0] }}
										transition={{
											duration: 1,
											repeat: Infinity,
										}}
										className="flex items-center justify-center"
										onClick={(e) => {
											e.stopPropagation();
											router.push(
												`/location/unit/${unit.id}`
											);
										}}
									>
										<FaMapMarkerAlt
											size={20}
											className="text-blue-600 drop-shadow-sm"
										/>
									</motion.div>
								);

								const unitMarker = new mapboxgl.Marker(unitEl)
									.setLngLat(unit.coords)
									.addTo(map);

								unitMarkers.current.push(unitMarker);
							});
						}}
					>
						<FaMapMarkerAlt
							size={32}
							className="text-red-600 drop-shadow-sm"
						/>
					</motion.div>
				);

				new mapboxgl.Marker(siteEl).setLngLat(site.coords).addTo(map);
			});
		});

		mapRef.current = map;

		return () => {
			if (mapRef.current) {
				try {
					mapRef.current.remove();
				} catch (err) {
					console.warn("Safe cleanup failed:", err);
				}
			}
		};
	}, [sites, router]);

	// ✅ Filter
	const filteredUnits = selectedSite
		? selectedSite.units.filter((u) =>
				u.name.toLowerCase().includes(unitSearch.toLowerCase())
		  )
		: [];

	return (
		<div className="flex h-[calc(100vh-4rem)] w-full gap-4 p-4">
			{/* Map */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
				className="flex-1 rounded-lg overflow-hidden border border-gray-300 shadow-sm"
			>
				{loading ? (
					<div className="w-full h-full flex items-center justify-center text-gray-500">
						Loading map...
					</div>
				) : (
					<div ref={mapContainer} className="w-full h-full" />
				)}
			</motion.div>

			{/* Side panel */}
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
							<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
								<h2 className="text-xl font-semibold text-gray-800">
									{selectedSite.name}
								</h2>
								<button
									onClick={() => {
										unitMarkers.current.forEach((m) =>
											m.remove()
										);
										unitMarkers.current = [];
										setSelectedSite(null);
									}}
									className="p-2 text-gray-500 hover:text-gray-700 transition"
								>
									<AiOutlineClose size={20} />
								</button>
							</div>

							<div className="flex items-center px-6 py-3 border border-gray-100 space-x-4 bg-gray-50">
								<div className="flex items-center gap-2">
									<span className="text-gray-600">Units</span>
									<span className="text-indigo-600 font-semibold">
										{selectedSite.units.length}
									</span>
								</div>
							</div>

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
								{/* <button className="mx-auto border border-gray-300 bg-gradient-to-r from-[#243972] to-[#cd2125] rounded-lg hover:bg-gray-200 h-full w-10 flex items-center justify-center transition">
									<FiFilter className="text-gray-100 mx-auto" />
								</button> */}
							</div>

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
								<div className="grid grid-cols-2 gap-2">
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
											className="bg-gray-50 p-2 text-center border border-gray-300 rounded-lg cursor-pointer transition"
											onClick={() =>
												router.push(
													`/location/unit/${unit.id}`
												)
											}
										>
											<div className="text-gray-800 text-xs font-medium">
												{unit.name}
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

					<AnimatePresence>
						{!selectedSite && !loading && (
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
										<FiMapPin className="text-gray-300 size-12" />
									</motion.div>
									<h3 className="text-xl font-semibold text-gray-700 mb-2">
										No Site Selected
									</h3>
									<p className="text-gray-500 mb-4">
										Click a site marker to see its units.
									</p>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
				</AnimatePresence>
			</div>
		</div>
	);
}
