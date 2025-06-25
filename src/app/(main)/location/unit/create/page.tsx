"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { MdMyLocation } from "react-icons/md";
import { v4 as uuidv4 } from "uuid";
import { Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Feature, Polygon } from "geojson"; // 👈 Important import for typing

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Location {
	id: string;
	locationName: string;
}

interface Unit {
	id: string;
	name: string;
	lat: number;
	lng: number;
	radius: number;
}

export default function CreateUnitPage() {
	const router = useRouter();
	const [selectedLocationId, setSelectedLocationId] = useState<string>("");
	const [unitName, setUnitName] = useState("");
	const [unitRadius, setUnitRadius] = useState(10);
	const [selectedPoint, setSelectedPoint] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [units, setUnits] = useState<Unit[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);

	const mapContainer = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const unitMarkersRef = useRef<mapboxgl.Marker[]>([]);

	const [sitesData, setSitesData] = useState<Location[]>([]);

	useEffect(() => {
		apiFetch<{ data: Location[] }>("/RMv2/get-all-locations", {
			method: "GET",
		})
			.then((res) => res.data && setSitesData(res.data))
			.catch((err) => {
				console.error(err);
				toast.error(
					"Failed to load locations. Please try again later."
				);
			});
	}, []);

	const uniqueLocations = useMemo(
		() =>
			sitesData.filter(
				(l, i, arr) => arr.findIndex((x) => x.id === l.id) === i
			),
		[sitesData]
	);

	useEffect(() => {
		if (!mapContainer.current) return;

		const map = new mapboxgl.Map({
			container: mapContainer.current,
			style: "mapbox://styles/mapbox/streets-v11",
			center: [77.5946, 12.9716],
			zoom: 5,
		});

		map.addControl(new mapboxgl.NavigationControl(), "top-right");

		map.on("click", (e) => {
			setSelectedPoint({ lat: e.lngLat.lat, lng: e.lngLat.lng });
			map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: 15 });
		});

		mapRef.current = map;

		return () => {
			unitMarkersRef.current.forEach((m) => m.remove());
			map.remove();
		};
	}, []);

	useEffect(() => {
		setUnits([]);
		setSelectedPoint(null);
		unitMarkersRef.current.forEach((m) => m.remove());
		unitMarkersRef.current = [];
	}, [selectedLocationId]);

	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		unitMarkersRef.current.forEach((m) => m.remove());
		unitMarkersRef.current = [];

		units.forEach((u) => {
			const marker = new mapboxgl.Marker({ color: "#00b300" })
				.setLngLat([u.lng, u.lat])
				.addTo(map);
			unitMarkersRef.current.push(marker);
		});

		if (selectedPoint) {
			const tempMarker = new mapboxgl.Marker({ color: "#ff9900" })
				.setLngLat([selectedPoint.lng, selectedPoint.lat])
				.addTo(map);
			unitMarkersRef.current.push(tempMarker);
		}
	}, [units, selectedPoint]);

	useEffect(() => {
		if (!mapRef.current || !selectedPoint) return;
		const map = mapRef.current;

		const circleData = createGeoJSONCircle(
			[selectedPoint.lng, selectedPoint.lat],
			unitRadius
		);

		if (map.getSource("unit-circle")) {
			(map.getSource("unit-circle") as mapboxgl.GeoJSONSource).setData(
				circleData
			);
		} else {
			map.addSource("unit-circle", {
				type: "geojson",
				data: circleData,
			});
			map.addLayer({
				id: "unit-circle-layer",
				type: "fill",
				source: "unit-circle",
				paint: {
					"fill-color": "#0080ff",
					"fill-opacity": 0.3,
				},
			});
		}
	}, [selectedPoint, unitRadius]);

	// ✅ FIXED FUNCTION: Strongly typed as GeoJSON Feature<Polygon>
	const createGeoJSONCircle = (
		center: [number, number],
		radiusInKm: number,
		points = 64
	): Feature<Polygon> => {
		const coords = {
			latitude: center[1],
			longitude: center[0],
		};
		const km = radiusInKm;

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
			geometry: {
				type: "Polygon",
				coordinates: [ret],
			},
			properties: {},
		};
	};

	const useMyUnit = () => {
		if (!selectedLocationId) {
			alert("Please select a location first.");
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const point = {
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
				};
				setSelectedPoint(point);
				if (mapRef.current) {
					mapRef.current.flyTo({
						center: [point.lng, point.lat],
						zoom: 15,
					});
				}
			},
			(err) => {
				console.error("Geolocation failed:", err);
				alert("Failed to get your unit location.");
			}
		);
	};

	const addOrUpdateUnit = () => {
		if (!selectedLocationId) return alert("Select a location.");
		if (!unitName) return alert("Enter unit name.");
		if (!selectedPoint) return alert("Click map or use 'Use My Unit'.");

		if (editingId) {
			setUnits(
				units.map((u) =>
					u.id === editingId
						? {
								...u,
								name: unitName,
								lat: selectedPoint.lat,
								lng: selectedPoint.lng,
								radius: unitRadius,
						  }
						: u
				)
			);
			setEditingId(null);
		} else {
			setUnits([
				...units,
				{
					id: uuidv4(),
					name: unitName,
					lat: selectedPoint.lat,
					lng: selectedPoint.lng,
					radius: unitRadius,
				},
			]);
		}
		setUnitName("");
		setUnitRadius(10);
		setSelectedPoint(null);
	};

	const editUnit = (u: Unit) => {
		setEditingId(u.id);
		setUnitName(u.name);
		setUnitRadius(u.radius);
		setSelectedPoint({ lat: u.lat, lng: u.lng });
	};

	const deleteUnit = (id: string) => {
		setUnits(units.filter((u) => u.id !== id));
	};

	const handleSave = async () => {
		if (!selectedLocationId) return alert("Select a location");
		if (units.length === 0) return alert("Add at least one unit");

		try {
			for (const u of units) {
				const payload = {
					unitId: 0,
					locationId: Number(selectedLocationId),
					unitName: u.name,
					unitCode: u.name.replace(/\s+/g, "_").toUpperCase(),
					createdOn: new Date().toISOString(),
					createdBy: "Awad",
					modifiedBy: "Awad",
					modifiedOn: new Date().toISOString(),
					lat: u.lat,
					lgt: u.lng,
					rad: u.radius,
				};

				const res = await fetch(
					"http://sfosrv02:86/api/RMv2/add-update-sfo-mrf-units",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					}
				);

				if (!res.ok)
					throw new Error(
						`Server error for unit "${u.name}": ${res.statusText}`
					);

				await res.json();
			}
			toast.success("Unit Succesfully Created");
			router.push("/location");
		} catch (err) {
			console.error(err);
			alert("Error saving units. Check console for details.");
		}
	};

	return (
		<div className="flex flex-col lg:flex-row h-screen w-full gap-4 p-4 md:p-6 bg-gray-50 overflow-hidden">
			<div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto">
				<h1 className="text-xl font-bold">Add Units Under Location</h1>

				<div>
					<label className="block text-sm font-medium mb-1">
						Select Location
					</label>
					<select
						value={selectedLocationId}
						onChange={(e) => {
							if (!e.target.value) {
								alert("Please select a valid location.");
								return;
							}
							setSelectedLocationId(e.target.value);
						}}
						className="w-full px-3 py-2 border border-green-600 rounded-xl"
					>
						<option value="" disabled>
							-- Select Location --
						</option>
						{uniqueLocations.map((loc) => (
							<option key={loc.id} value={loc.id}>
								{loc.locationName}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Unit Name
					</label>
					<input
						type="text"
						value={unitName}
						onChange={(e) => setUnitName(e.target.value)}
						placeholder="e.g. Unit A"
						className="w-full px-3 py-2 border border-green-600 rounded-xl"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Radius (km)
					</label>
					<input
						type="number"
						min="1"
						value={unitRadius}
						onChange={(e) =>
							setUnitRadius(Math.max(1, Number(e.target.value)))
						}
						className="w-full px-3 py-2 border border-green-600 rounded-xl"
					/>
				</div>

				<div className="flex flex-col sm:flex-row justify-between gap-2">
					<button
						onClick={useMyUnit}
						disabled={!selectedLocationId}
						className="flex w-full items-center cursor-pointer justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full border border-green-600 hover:bg-green-700 transition disabled:opacity-50"
					>
						<MdMyLocation /> Use My Unit
					</button>

					<button
						onClick={addOrUpdateUnit}
						disabled={!unitName || !selectedLocationId}
						className="flex w-full items-center justify-center cursor-pointer gap-2 px-4 py-2 bg-white text-blue-800 rounded-full border border-blue-800 hover:bg-blue-50 disabled:opacity-50"
					>
						<FiPlus /> {editingId ? "Update Unit" : "Add Unit"}
					</button>
				</div>

				{units.length > 0 && (
					<div>
						<h2 className="font-semibold">Units</h2>

						<ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{units.map((u) => (
								<li
									key={u.id}
									className="flex items-center justify-between p-3 rounded-xl border border-green-600 bg-white shadow-sm"
								>
									<div className="flex flex-col w-[50%]">
										<span className="font-medium text-gray-800 truncate">
											{u.name}
										</span>
										<span className="text-xs text-gray-500">
											Radius: {u.radius} km
										</span>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => editUnit(u)}
											className="text-blue-600 border border-green-600 rounded-full p-1 hover:bg-blue-50"
										>
											<FiEdit2 size={16} />
										</button>
										<button
											onClick={() => deleteUnit(u.id)}
											className="text-red-600 border border-green-600 rounded-full p-1 hover:bg-red-50"
										>
											<FiTrash2 size={16} />
										</button>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}

				<button
					onClick={handleSave}
					className="mt-4 bg-green-600 flex justify-center items-center gap-2 cursor-pointer text-white px-4 py-2 rounded-full border border-green-600 hover:bg-green-700"
				>
					<span>Save Units</span> <Save size={20} />
				</button>

				<p className="text-xs text-gray-500 mt-2">
					✅ Select Location → Add multiple units (Use My Unit or
					click map) → Units appear on map → Submit.
				</p>
			</div>

			<div className="flex-1 rounded-xl border border-green-600 overflow-hidden shadow-lg h-[450px] min-h-[300px]">
				<div ref={mapContainer} className="w-full h-full" />
			</div>
		</div>
	);
}
