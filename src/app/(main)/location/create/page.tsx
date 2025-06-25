"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiSave } from "react-icons/fi";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { getCookie } from "cookies-next";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function AddLocationPage() {
	const router = useRouter();

	const [locationName, setLocationName] = useState("");
	const [locationCode, setLocationCode] = useState("");
	const [lat, setLat] = useState(0);
	const [lgt, setLgt] = useState(0);
	const [rad, setRad] = useState(500);
	const [loading, setLoading] = useState(false);

	const mapContainer = useRef<HTMLDivElement | null>(null);
	const map = useRef<mapboxgl.Map | null>(null);
	const marker = useRef<mapboxgl.Marker | null>(null);

	useEffect(() => {
		if (map.current) return;

		map.current = new mapboxgl.Map({
			container: mapContainer.current!,
			style: "mapbox://styles/mapbox/satellite-streets-v12",
			center: [lgt || 76.3, lat || 10.0],
			zoom: 8,
		});

		map.current.on("click", (e) => {
			const { lng, lat } = e.lngLat;
			setLgt(lng);
			setLat(lat);

			const el = document.createElement("div");
			el.className = "custom-marker";
			el.style.backgroundImage = "url('/location-icon.svg')";
			el.style.backgroundSize = "contain";
			el.style.width = "30px";
			el.style.height = "30px";

			if (marker.current) {
				marker.current.setLngLat([lng, lat]);
			} else {
				marker.current = new mapboxgl.Marker({ element: el })
					.setLngLat([lng, lat])
					.addTo(map.current!);
			}

			map.current?.flyTo({
				center: [lng, lat],
				zoom: 15,
				speed: 1.2,
			});

			drawCircle([lng, lat], rad);
		});
	}, []);

	useEffect(() => {
		if (lat && lgt && map.current) {
			drawCircle([lgt, lat], rad);
		}
	}, [rad]);

	const drawCircle = (center: [number, number], radiusMeters: number) => {
		if (!map.current) return;

		const circleGeoJSON = createGeoJSONCircle(center, radiusMeters);

		if (map.current.getSource("radius-circle")) {
			(
				map.current.getSource("radius-circle") as mapboxgl.GeoJSONSource
			)?.setData(circleGeoJSON);
		} else {
			map.current?.addSource("radius-circle", {
				type: "geojson",
				data: circleGeoJSON,
			});

			map.current?.addLayer({
				id: "radius-circle-layer",
				type: "fill",
				source: "radius-circle",
				paint: {
					"fill-color": "#1D4ED8",
					"fill-opacity": 0.3,
				},
			});
		}
	};

	const createGeoJSONCircle = (
		center: [number, number],
		radiusInMeters: number,
		points = 64
	): GeoJSON.Feature<GeoJSON.Polygon> => {
		const coords = {
			latitude: center[1],
			longitude: center[0],
		};

		const km = radiusInMeters / 1000;
		const ret: [number, number][] = [];
		const distanceX =
			km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
		const distanceY = km / 110.574;

		for (let i = 0; i < points; i++) {
			const theta = (i / points) * (2 * Math.PI);
			const x = distanceX * Math.cos(theta);
			const y = distanceY * Math.sin(theta);
			ret.push([coords.longitude + x, coords.latitude + y]);
		}
		ret.push(ret[0]);

		return {
			type: "Feature",
			properties: {}, // ✅ Fixed: required by Mapbox types
			geometry: {
				type: "Polygon",
				coordinates: [ret],
			},
		};
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		const createdOn = new Date().toISOString();
		let createdBy = "";
		try {
			const raw = getCookie("UserData");
			if (typeof raw === "string") {
				const data = JSON.parse(raw);
				createdBy = data?.employee_name || "";
			}
		} catch {}

		try {
			const res = await apiFetch<{ type: number; message: string }>(
				"/RMv2/add-update-location/",
				{
					method: "POST",
					body: JSON.stringify({
						id: 0,
						locationName,
						locationCode,
						lat,
						lgt,
						rad,
						createdOn,
						createdBy,
						modifiedOn: createdOn,
						modifiedBy: createdBy,
						sfomfrUnits: [],
					}),
				}
			);

			if (res.type === 1) {
				toast.success("Location saved successfully!");
				router.push("/location");
			} else {
				toast.error(res.message || "Failed to save location");
			}
		} catch (err) {
			console.error("API error:", err);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col lg:flex-row p-4 sm:p-6 md:p-10 gap-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="w-full lg:w-1/2 bg-white rounded-xl border border-gray-300 shadow-sm p-6"
			>
				<h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
					Add New Location
				</h1>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="flex flex-col">
						<label
							htmlFor="locationName"
							className="mb-2 font-medium text-gray-700"
						>
							Location Name
						</label>
						<input
							id="locationName"
							type="text"
							value={locationName}
							onChange={(e) => setLocationName(e.target.value)}
							required
							placeholder="e.g. Chennai HQ"
							className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
						/>
					</div>

					<div className="flex flex-col">
						<label
							htmlFor="locationCode"
							className="mb-2 font-medium text-gray-700"
						>
							Location Code
						</label>
						<input
							id="locationCode"
							type="text"
							value={locationCode}
							onChange={(e) => setLocationCode(e.target.value)}
							required
							placeholder="e.g. CHN-HQ"
							className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
						/>
					</div>

					<div className="flex flex-col">
						<label
							htmlFor="rad"
							className="mb-2 font-medium text-gray-700"
						>
							Radius (meters)
						</label>
						<input
							id="rad"
							type="number"
							value={rad}
							onChange={(e) => setRad(Number(e.target.value))}
							placeholder="e.g. 500"
							className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
						/>
					</div>

					<div className="flex justify-between text-sm mt-2">
						<span>Latitude: {lat.toFixed(6)}</span>
						<span>Longitude: {lgt.toFixed(6)}</span>
					</div>

					<motion.button
						type="submit"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						disabled={loading}
						className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-700 text-white font-medium rounded-xl hover:bg-green-800 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 transition"
					>
						<FiSave className="text-lg" />
						{loading ? "Saving..." : "Save Location"}
					</motion.button>
				</form>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="w-full lg:w-1/2 h-[400px] lg:h-auto rounded-xl overflow-hidden border border-gray-300"
			>
				<div ref={mapContainer} className="w-full h-full" />
			</motion.div>
		</div>
	);
}
