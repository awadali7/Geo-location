// "use client";

// import React, { useEffect, useMemo, useState, useRef } from "react";
// import EmployeeCard, { Employee } from "@/components/ui/EmployeeCard";
// import EmployeeSearch from "@/components/ui/EmployeeSearch";
// import FilterSelect from "@/components/ui/FilterSelect";
// import FilterLocation from "@/components/ui/FilterLocation";
// import FilterDept from "@/components/ui/FilterDept";
// import { apiFetch } from "@/lib/api";
// import { IoFilter } from "react-icons/io5";
// import { AnimatePresence, motion } from "framer-motion";
// import Image from "next/image";
// import Link from "next/link";
// import { EmployeeCardSkeleton } from "@/components/ui/EmployeeCardSkeleton";

// interface Department {
// 	id: number;
// 	dName: string;
// }
// interface Unit {
// 	unitId: number;
// 	unitName: string;
// 	sfoLocations: { locationName: string };
// }
// interface EmployeeInfo {
// 	employeeId: number;
// 	employeeName: string;
// 	employeeCode: string;
// 	units: Unit;
// 	status: 0 | 1;
// }
// interface DashboardPayload {
// 	department: Department;
// 	totalEmployee: number;
// 	employeeLeaveCount: number;
// 	onSiteEmployeeCount: number;
// 	employeesInformation: EmployeeInfo[];
// }
// interface Location {
// 	id: number;
// 	locationName: string;
// 	sfomfrUnits: { unitName: string }[];
// }

// export default function DashboardPage() {
// 	const [departmentsData, setDepartmentsData] = useState<Department[]>([]);
// 	const [departmentFilter, setDepartmentFilter] = useState<number | null>(
// 		null
// 	);
// 	const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(
// 		null
// 	);
// 	const [sitesData, setSitesData] = useState<Location[]>([]);

// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [siteFilter, setSiteFilter] = useState("");
// 	const [unitFilter, setUnitFilter] = useState("");
// 	const [filterOpen, setFilterOpen] = useState(false);
// 	const [localDept, setLocalDept] = useState<number | null>(null);
// 	const [localSite, setLocalSite] = useState("");
// 	const [localUnit, setLocalUnit] = useState("");
// 	const filterRef = useRef<HTMLDivElement>(null);
// 	// const [loading, setLoading] = useState(true);

// 	useEffect(() => {
// 		apiFetch<{ data: Department[] }>("/RMv2/get-all-department", {
// 			method: "GET",
// 		})
// 			.then((res) => {
// 				const deps = res.data || [];
// 				setDepartmentsData(deps);
// 				if (deps.length) {
// 					setDepartmentFilter(deps[0].id);
// 					setLocalDept(deps[0].id);
// 				}
// 			})
// 			.catch(console.error);
// 	}, []);

// 	// useEffect(() => {
// 	// 	if (departmentFilter == null) return;
// 	// 	setLoading(true);
// 	// 	const today = new Date().toISOString();
// 	// 	const qs = `?input_date=${today}&departmentId=${departmentFilter}`;
// 	// 	apiFetch<{ data: Location[] }>(`/RMv2/get-dashboard-data${qs}`, { method: "POST" })
// 	// 		.then((res) => setDashboardData(res.data))
// 	// 		.catch(console.error)
// 	// 		.finally(() => setLoading(false));
// 	// }, [departmentFilter]);

// 	useEffect(() => {
// 		apiFetch<{ data: Location[] }>("/RMv2/get-all-locations", {
// 			method: "GET",
// 		})
// 			.then((res) => setSitesData(res.data || []))
// 			.catch(console.error);
// 	}, []);

// 	useEffect(() => {
// 		if (filterOpen) {
// 			setLocalDept(departmentFilter);
// 			setLocalSite(siteFilter);
// 			setLocalUnit(unitFilter);
// 		}
// 	}, [filterOpen, departmentFilter, siteFilter, unitFilter]);

// 	useEffect(() => {
// 		const handler = (e: MouseEvent) => {
// 			if (
// 				filterRef.current &&
// 				!filterRef.current.contains(e.target as Node)
// 			) {
// 				setFilterOpen(false);
// 			}
// 		};
// 		document.addEventListener("mousedown", handler);
// 		return () => document.removeEventListener("mousedown", handler);
// 	}, []);

// 	const siteOptions = useMemo(() => {
// 		if (localUnit) {
// 			return sitesData
// 				.filter((s) =>
// 					s.sfomfrUnits.some((u) => u.unitName === localUnit)
// 				)
// 				.map((s) => s.locationName);
// 		}
// 		return sitesData.map((s) => s.locationName);
// 	}, [sitesData, localUnit]);

// 	const unitOptions = useMemo(() => {
// 		if (localSite) {
// 			return (
// 				sitesData
// 					.find((s) => s.locationName === localSite)
// 					?.sfomfrUnits.map((u) => u.unitName) || []
// 			);
// 		}
// 		return Array.from(
// 			new Set(
// 				sitesData.flatMap((s) => s.sfomfrUnits.map((u) => u.unitName))
// 			)
// 		);
// 	}, [sitesData, localSite]);

// 	const employeesData: Employee[] = useMemo(() => {
// 		if (!dashboardData) return [];
// 		return dashboardData.employeesInformation.map((e) => ({
// 			name: e.employeeName,
// 			designation: e.units.sfoLocations.createdOn,
// 			mode: e.units.unitName,
// 			status: e.status === 0 ? "present" : "movement",
// 			department: dashboardData.department.dName,
// 			location: e.units.sfoLocations.locationName,
// 		}));
// 	}, [dashboardData]);

// 	const filteredEmployees = useMemo(
// 		() =>
// 			employeesData.filter((e) => {
// 				const okName = e.name
// 					.toLowerCase()
// 					.includes(searchTerm.toLowerCase());
// 				const deptName = departmentsData.find(
// 					(d) => d.id === departmentFilter
// 				)?.dName;
// 				const okDept = !deptName || e.department === deptName;
// 				const okSite = !siteFilter || e.location === siteFilter;
// 				const okUnit = !unitFilter || e.mode === unitFilter;
// 				return okName && okDept && okSite && okUnit;
// 			}),
// 		[
// 			employeesData,
// 			searchTerm,
// 			departmentFilter,
// 			siteFilter,
// 			unitFilter,
// 			departmentsData,
// 		]
// 	);

// 	const skeletons = [...Array(8)].map((_, i) => (
// 		<EmployeeCardSkeleton key={i} />
// 	));

// 	return (
// 		<div className="flex flex-col w-full gap-6 p-6">
// 			<div className="grid grid-cols-3 gap-6">
// 				<StatCard
// 					title="Total Employees"
// 					value={dashboardData?.totalEmployee ?? 0}
// 					color="blue"
// 				/>
// 				<StatCard
// 					title="On Site"
// 					value={dashboardData?.onSiteEmployeeCount ?? 0}
// 					color="green"
// 				/>
// 				<StatCard
// 					title="On Leave"
// 					value={dashboardData?.employeeLeaveCount ?? 0}
// 					color="red"
// 				/>
// 			</div>

// 			<div className="relative flex flex-wrap items-center justify-between gap-4 mb-6">
// 				<div className="w-[60%]">
// 					<EmployeeSearch
// 						employees={employeesData}
// 						searchTerm={searchTerm}
// 						setSearchTerm={setSearchTerm}
// 					/>
// 				</div>
// 				<div className="flex items-center gap-4 w-full sm:w-auto">
// 					<FilterDept
// 						options={departmentsData}
// 						value={localDept ?? undefined}
// 						onChange={(val) => {
// 							setDepartmentFilter(val);
// 							setLocalDept(val);
// 						}}
// 					/>
// 					<button
// 						onClick={() => setFilterOpen((o) => !o)}
// 						className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2 flex items-center gap-2 cursor-pointer transition hover:border-gray-400 focus:ring-1 focus:ring-indigo-600"
// 					>
// 						<IoFilter className="text-xl text-gray-600" /> Filter
// 					</button>
// 					<Link
// 						href="/dashboard/relocate"
// 						className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2 flex items-center gap-2 cursor-pointer transition hover:border-gray-400 focus:ring-1 focus:ring-indigo-600"
// 					>
// 						Relocate{" "}
// 						<Image
// 							src="/location.gif"
// 							alt="relocate"
// 							width={25}
// 							height={15}
// 						/>
// 					</Link>

// 					<AnimatePresence>
// 						{filterOpen && (
// 							<motion.div
// 								ref={filterRef}
// 								initial={{ opacity: 0, scale: 0.95 }}
// 								animate={{ opacity: 1, scale: 1 }}
// 								exit={{ opacity: 0, scale: 0.95 }}
// 								transition={{ duration: 0.2 }}
// 								className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-20 origin-top-right"
// 							>
// 								<h4 className="mb-4 text-lg font-medium text-gray-800">
// 									Filters
// 								</h4>
// 								<div className="mb-4 flex flex-col gap-4">
// 									<FilterSelect
// 										placeholder="Site"
// 										options={siteOptions}
// 										value={localSite}
// 										onChange={(v) => {
// 											setLocalSite(v);
// 											setLocalUnit("");
// 										}}
// 									/>
// 									<FilterLocation
// 										placeholder="Unit"
// 										options={unitOptions}
// 										value={localUnit}
// 										onChange={setLocalUnit}
// 									/>
// 								</div>
// 								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
// 									<button
// 										onClick={() => setFilterOpen(false)}
// 										className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
// 									>
// 										Cancel
// 									</button>
// 									<button
// 										onClick={() => {
// 											setSiteFilter(localSite);
// 											setUnitFilter(localUnit);
// 											setFilterOpen(false);
// 										}}
// 										className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#243972] to-[#cd2125] hover:from-[#cd2125] hover:to-[#1f355f] text-white font-medium transition"
// 									>
// 										Submit
// 									</button>
// 								</div>
// 							</motion.div>
// 						)}
// 					</AnimatePresence>
// 				</div>
// 			</div>

// 			<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
// 				{loading
// 					? skeletons
// 					: filteredEmployees.map((emp) => (
// 							<EmployeeCard key={emp.name} employee={emp} />
// 					  ))}
// 			</div>
// 		</div>
// 	);
// }

// function StatCard({
// 	title,
// 	value,
// 	color,
// }: {
// 	title: string;
// 	value: number;
// 	color: "blue" | "green" | "red";
// }) {
// 	const bg =
// 		color === "blue"
// 			? "bg-blue-50"
// 			: color === "green"
// 			? "bg-green-50"
// 			: "bg-red-50";
// 	return (
// 		<div
// 			className={`${bg} shadow-xs rounded-lg border border-gray-300 p-6`}
// 		>
// 			<h3 className="mb-2 text-lg font-medium text-gray-700">{title}</h3>
// 			<p className="text-3xl font-semibold text-gray-900">{value}</p>
// 		</div>
// 	);
// }

import React from "react";

export default function page() {
	return <div>Hello</div>;
}
