// app/locations/create/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch } from "react-icons/fi";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Suggestion {
	id: string;
	place_name: string;
	center: [number, number];
}

export default function CreateLocationPage() {
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [coords, setCoords] = useState<[number, number] | null>(null);
	const [landmark, setLandmark] = useState<string>("");
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const markerRef = useRef<mapboxgl.Marker | null>(null);

	// Initialize the map once
	useEffect(() => {
		if (!mapContainer.current) return;
		const map = new mapboxgl.Map({
			container: mapContainer.current,
			style: "mapbox://styles/mapbox/streets-v11",
			center: [77.5946, 12.9716], // default to Bengaluru
			zoom: 10,
		});
		map.addControl(new mapboxgl.NavigationControl(), "top-right");
		map.on("click", (e) => {
			const lngLat = [e.lngLat.lng, e.lngLat.lat] as [number, number];
			handleSelectCoords(lngLat);
		});
		mapRef.current = map;
		return () => {
			map.remove();
		};
	}, []);

	// Fly and place marker when coords change
	useEffect(() => {
		if (!coords || !mapRef.current) return;
		const map = mapRef.current;
		map.flyTo({ center: coords, zoom: 14, speed: 1.2 });
		if (markerRef.current) {
			markerRef.current.setLngLat(coords);
		} else {
			markerRef.current = new mapboxgl.Marker({ color: "#d00" })
				.setLngLat(coords!)
				.addTo(map);
		}
		// reverse geocode for nearby landmarks
		fetch(
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?types=poi,landmark&limit=5&access_token=${mapboxgl.accessToken}`
		)
			.then((res) => res.json())
			.then((data) => {
				setSuggestions(data.features as Suggestion[]);
			});
	}, [coords]);

	// Forward geocode on query change
	useEffect(() => {
		if (!query) {
			setSuggestions([]);
			return;
		}
		const timer = setTimeout(() => {
			fetch(
				`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
					query
				)}.json?autocomplete=true&limit=5&access_token=${
					mapboxgl.accessToken
				}`
			)
				.then((res) => res.json())
				.then((data) => {
					setSuggestions(data.features as Suggestion[]);
				});
		}, 300);
		return () => clearTimeout(timer);
	}, [query]);

	const handleSelectCoords = (lngLat: [number, number]) => {
		setCoords(lngLat);
		setLandmark("");
		setQuery("");
	};

	const handleSelectSuggestion = (s: Suggestion) => {
		setCoords(s.center);
		setLandmark(s.place_name);
		setSuggestions([]);
		setQuery(s.place_name);
	};

	return (
		<div className="flex h-full w-full gap-6 p-6 bg-gray-50">
			{/* Control Panel */}
			<div className="w-1/3 flex flex-col gap-6">
				<div className="flex flex-col gap-4">
					<label className="font-medium text-gray-700">
						Search Location
					</label>
					<div className="relative">
						<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							placeholder="Type address or landmark..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition"
						/>
					</div>
					<AnimatePresence>
						{suggestions?.length > 0 && (
							<motion.ul
								initial={{ opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								className="max-h-48 overflow-auto bg-white rounded-lg shadow-lg divide-y divide-gray-200"
							>
								{suggestions?.map((s) => (
									<li
										key={s.id}
										onClick={() =>
											handleSelectSuggestion(s)
										}
										className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
									>
										{s.place_name}
									</li>
								))}
							</motion.ul>
						)}
					</AnimatePresence>
				</div>

				<button
					onClick={() => {
						navigator.geolocation.getCurrentPosition((pos) => {
							handleSelectCoords([
								pos.coords.longitude,
								pos.coords.latitude,
							]);
						});
					}}
					className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
				>
					Use My Location
				</button>

				<div className="flex flex-col gap-1">
					<label className="font-medium text-gray-700">
						Selected Landmark
					</label>
					<input
						type="text"
						value={landmark}
						readOnly
						placeholder="—"
						className="w-full px-4 py-2 bg-gray-100 rounded-lg border border-gray-300"
					/>
				</div>

				<div className="flex flex-col gap-1">
					<label className="font-medium text-gray-700">
						Coordinates
					</label>
					<input
						type="text"
						readOnly
						value={
							coords
								? `${coords[1].toFixed(6)}, ${coords[0].toFixed(
										6
								  )}`
								: ""
						}
						placeholder="—"
						className="w-full px-4 py-2 bg-gray-100 rounded-lg border border-gray-300"
					/>
				</div>
			</div>

			{/* Map Panel */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
				className="flex-1 rounded-lg overflow-hidden shadow-lg"
			>
				<div ref={mapContainer} className="w-full h-full" />
			</motion.div>
		</div>
	);
}
