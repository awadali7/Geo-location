"use client";

import { useEffect, useRef, useState } from "react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Label,
} from "recharts";
import type { Payload } from "recharts/types/component/DefaultLegendContent";
import mapboxgl from "mapbox-gl";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const COLORS = ["#34d399", "#60a5fa", "#de1d13"];

interface Department {
	id: number;
	dName: string;
}

interface UnitData {
	unitId: number;
	unitName: string;
	lat?: number;
	lgt?: number;
	rad?: number;
}

interface Employee {
	id?: number;
	employeeId?: number;
	employeeName: string;
	employeeCode: string;
	emailId?: string;
	email?: string;
	departmentId: number;
	homeMFRUnitId: number;
	createdOn: string;
	lastLoginTime: string | null;
	role: number;
	status: 0 | 1 | 2;
	units: UnitData;
}

const statusLabels: Record<0 | 1 | 2, string> = {
	0: "Present",
	1: "Movement",
	2: "Short Leave",
};

export default function DashboardPage() {
	const mapContainer = useRef<HTMLDivElement | null>(null);
	const map = useRef<mapboxgl.Map | null>(null);
	const params = useParams();
	const slug = params?.slug;
	const slugNumber = Number(slug);

	const [departments, setDepartments] = useState<Department[]>([]);
	const [selectedDept, setSelectedDept] = useState<number | null>(null);
	const [userData, setUserData] = useState<Employee[]>([]);
	const [currentUnit, setCurrentUnit] = useState<UnitData | null>(null);

	const [statusCount, setStatusCount] = useState<
		Record<"Present" | "Movement" | "ShortLeave", number>
	>({
		Present: 0,
		Movement: 0,
		ShortLeave: 0,
	});

	const pieData = [
		{ name: "On Site", value: statusCount.Present },
		{ name: "Movement", value: statusCount.Movement },
		{ name: "Short Leave", value: statusCount.ShortLeave },
	];

	useEffect(() => {
		if (map.current || !mapContainer.current) return;

		map.current = new mapboxgl.Map({
			container: mapContainer.current,
			style: "mapbox://styles/mapbox/streets-v12",
			center: [-0.1276, 51.5072],
			zoom: 8,
		});
	}, []);

	useEffect(() => {
		if (!map.current || !currentUnit) return;

		const lat = currentUnit.lat ?? 0;
		const lng = currentUnit.lgt ?? 0;
		const radius = currentUnit.rad ?? 0;

		map.current.flyTo({ center: [lng, lat], zoom: 10 });

		const el = document.createElement("div");
		el.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
				<path fill="#FF0000" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z"/>
			</svg>
		`;
		el.style.width = "40px";
		el.style.height = "40px";
		el.style.cursor = "pointer";

		const marker = new mapboxgl.Marker(el)
			.setLngLat([lng, lat])
			.addTo(map.current);

		const addCircle = () => {
			if (!map.current) return;

			if (map.current.getLayer("unit-circle")) {
				map.current.removeLayer("unit-circle");
			}
			if (map.current.getSource("unit-circle")) {
				map.current.removeSource("unit-circle");
			}

			map.current.addSource("unit-circle", {
				type: "geojson",
				data: {
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: [lng, lat],
					},
					properties: {}, // FIXED
				},
			});

			map.current.addLayer({
				id: "unit-circle",
				type: "circle",
				source: "unit-circle",
				paint: {
					"circle-radius": {
						stops: [
							[0, 0],
							[20, radius],
						],
						base: 2,
					},
					"circle-color": "#3b82f6",
					"circle-opacity": 0.3,
				},
			});
		};

		if (map.current.isStyleLoaded()) {
			addCircle();
		} else {
			map.current.once("load", addCircle);
		}

		return () => {
			marker.remove();
		};
	}, [currentUnit]);

	const handleExport = () => {
		if (userData.length === 0) return;

		const worksheet: XLSX.WorkSheet = {};
		const header = [
			"Employee ID",
			"Name",
			"Email",
			"Employee Code",
			"Status",
		];
		header.forEach((h, col) => {
			const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
			worksheet[cellAddress] = { v: h, t: "s" };
		});
		userData.forEach((emp, rowIndex) => {
			const row = [
				emp.id ?? emp.employeeId,
				emp.employeeName,
				emp.emailId ?? emp.email,
				emp.employeeCode,
				statusLabels[emp.status],
			];
			row.forEach((val, col) => {
				const cellAddress = XLSX.utils.encode_cell({
					r: rowIndex + 1,
					c: col,
				});
				worksheet[cellAddress] = { v: val, t: "s" };
			});
		});
		worksheet["!ref"] = XLSX.utils.encode_range({
			s: { r: 0, c: 0 },
			e: { r: userData.length, c: header.length - 1 },
		});
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
		XLSX.writeFile(workbook, "Employee_List.xlsx");
	};

	useEffect(() => {
		apiFetch<{ data: Department[] }>("/RMv2/get-all-department", {
			method: "GET",
		}).then((res) => {
			const response = res.data || [];
			setDepartments(response);
			if (response.length) {
				setSelectedDept(response[0].id);
			}
		});
	}, []);

	useEffect(() => {
		const counts = { Present: 0, Movement: 0, ShortLeave: 0 };
		userData.forEach((item: Employee) => {
			const label = statusLabels[item.status];
			const key = label.replace(" ", "") as keyof typeof counts;
			counts[key]++;
		});
		setCurrentUnit(userData[0]?.units ?? null);
		setStatusCount(counts);
	}, [userData]);

	useEffect(() => {
		if (selectedDept == null || isNaN(slugNumber)) return;

		const today = new Date().toISOString();
		const qs = `?input_date=${today}&departmentId=${selectedDept}`;
		apiFetch<{ data: { employeesInformation: Employee[] } }>(
			`/RMv2/get-dashboard-data${qs}`,
			{
				method: "POST",
			}
		).then((res) => {
			const employeInfo = res?.data?.employeesInformation || [];
			const filterData = employeInfo.filter(
				(item: Employee) => item.units?.unitId === slugNumber
			);
			setUserData(filterData);
		});
	}, [selectedDept, slugNumber]);

	const renderCustomLegend = ({ payload }: { payload?: Payload[] }) => {
		return (
			<ul className="flex flex-wrap justify-center gap-4 mt-4">
				{payload?.map((entry, index) => (
					<li
						key={`item-${index}`}
						className={` ${
							entry.color === "#34d399"
								? "bg-green-50"
								: entry.color === "#60a5fa"
								? "bg-blue-50"
								: "bg-red-50"
						} flex items-center gap-2 py-1 px-3 rounded-full`}
					>
						<span className="text-sm">{entry.value}</span>
						<span
							className="text-sm font-bold"
							style={{ color: entry.color }}
						>
							{pieData[index].value}
						</span>
					</li>
				))}
			</ul>
		);
	};

	return (
		<main className="px-4 py-6 md:px-6 space-y-6 bg-[#f7f7f7]">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
				<h1 className="text-2xl font-bold">Overview</h1>
				<div className="flex flex-col sm:flex-row items-center gap-4">
					<select
						className="border border-gray-300 rounded-full px-3 py-2 text-sm"
						value={selectedDept ?? ""}
						onChange={(e) =>
							setSelectedDept(Number(e.target.value))
						}
					>
						{departments.map((dept) => (
							<option key={dept.id} value={dept.id}>
								{dept.dName}
							</option>
						))}
					</select>
					<Link
						href="/location/unit/create"
						className="px-4 py-2 bg-teal-600 text-white rounded-full flex items-center gap-2"
					>
						<FiPlus /> Add New Unit
					</Link>
				</div>
			</div>

			{/* Charts and Map */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<motion.div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow flex flex-col items-center">
					<h2 className="text-lg font-semibold mb-4">
						Workforce Status Breakdown
					</h2>
					<ResponsiveContainer width="100%" height={250}>
						<PieChart>
							<Pie
								data={pieData}
								cx="50%"
								cy="50%"
								outerRadius={100}
								innerRadius={50}
								dataKey="value"
							>
								{pieData.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[index % COLORS.length]}
									/>
								))}
								<Label
									value={`Total: ${pieData.reduce(
										(sum, entry) => sum + entry.value,
										0
									)}`}
									position="center"
									className="text-xl font-bold fill-gray-700"
								/>
							</Pie>
							<Tooltip
								formatter={(value: number) =>
									`${value} employees`
								}
							/>
							<Legend content={renderCustomLegend} />
						</PieChart>
					</ResponsiveContainer>
				</motion.div>

				<motion.div className="w-full bg-white border border-gray-300 rounded-xl p-4 shadow flex flex-col gap-4">
					<h2 className="text-lg font-semibold">
						Live Unit Tracking
					</h2>
					<div className="relative h-[260px] w-full overflow-hidden rounded-xl border border-gray-300">
						<div ref={mapContainer} className="w-full h-full" />
						<div className="absolute inset-0 bg-black/20 text-black flex items-center justify-center font-semibold pointer-events-none">
							{currentUnit?.unitName || "Content Loading ..."}
						</div>
					</div>
				</motion.div>
			</div>

			{/* Employee Table */}
			<motion.div className="bg-white border border-gray-300 rounded-xl p-4 shadow">
				<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
					<h2 className="text-lg font-semibold">Employee List</h2>
					<button
						onClick={handleExport}
						className="px-3 py-1 border cursor-pointer border-green-700 text-green-700 rounded-full whitespace-nowrap"
					>
						Export
					</button>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="border-b border-gray-300">
								<th className="p-2 whitespace-nowrap">
									Employee ID
								</th>
								<th className="p-2 whitespace-nowrap">Name</th>
								<th className="p-2 whitespace-nowrap">Email</th>
								<th className="p-2 whitespace-nowrap">
									Employee Code
								</th>
								<th className="p-2 whitespace-nowrap">
									Status
								</th>
							</tr>
						</thead>
						<tbody>
							{userData.map((emp, index) => (
								<tr
									key={index}
									className="border-b border-gray-300"
								>
									<td className="p-2 whitespace-nowrap">
										{emp.id ?? emp.employeeId}
									</td>
									<td className="p-2 whitespace-nowrap">
										{emp.employeeName}
									</td>
									<td className="p-2 whitespace-nowrap">
										{emp.emailId ?? emp.email}
									</td>
									<td className="p-2 whitespace-nowrap">
										{emp.employeeCode}
									</td>
									<td className="p-2 whitespace-nowrap">
										<span
											className={`px-2 py-1 rounded-full text-sm ${
												emp.status === 0
													? "bg-green-100 text-green-700"
													: emp.status === 1
													? "bg-blue-100 text-blue-700"
													: "bg-yellow-100 text-yellow-700"
											}`}
										>
											{statusLabels[emp.status]}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</motion.div>
		</main>
	);
}
