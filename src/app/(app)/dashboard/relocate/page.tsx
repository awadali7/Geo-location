"use client";

import React, { useEffect, useState, useMemo, FC, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { z } from "zod";
import { getCookie } from "cookies-next";
import { toZuluISOString } from "@/utils/funtions";
import { toast } from "sonner";

// --- Zod schema for validation ---
const relocateSchema = z
	.object({
		unit: z.string().nonempty({ message: "Please select a unit." }),
		status: z.enum(["1", "2"]),
		reason: z
			.string()
			.max(100, { message: "Reason cannot exceed 100 characters." }),
		startTime: z.string(),
		endTime: z.string(),
	})
	.superRefine((data, ctx) => {
		if (data.status === "1" && !data.reason.trim()) {
			ctx.addIssue({
				code: "custom",
				path: ["reason"],
				message: "Reason is required for movement.",
			});
		}
		if (data.status === "2") {
			if (!data.startTime) {
				ctx.addIssue({
					code: "custom",
					path: ["startTime"],
					message: "Start time is required for short leave.",
				});
			}
			if (!data.endTime) {
				ctx.addIssue({
					code: "custom",
					path: ["endTime"],
					message: "End time is required for short leave.",
				});
			}
		}
	});

interface Unit {
	unitId: number;
	locationId: number;
	unitName: string;
	unitCode: string;
	createdBy: string;
	createdOn: string;
	modifiedBy: string | null;
	modifiedOn: string | null;
}

export interface Location {
	id: number;
	locationName: string;
	locationCode: string;
	createdBy: string;
	createdOn: string;
	modifiedBy: string | null;
	modifiedOn: string | null;
	sfomfrUnits: Unit[];
}

type CombinedUnit = Unit & { locationName: string };

const fieldVariants = {
	hidden: { opacity: 0, height: 0, y: -10 },
	visible: { opacity: 1, height: "auto", y: 0 },
	exit: { opacity: 0, height: 0, y: -10 },
};

const RelocatePage: FC = () => {
	const router = useRouter();

	// form state
	const [unit, setUnit] = useState<string>("");
	const [status, setStatus] = useState<"1" | "2">("1");
	const [reason, setReason] = useState<string>("");
	const [startTime, setStartTime] = useState<string>("");
	const [endTime, setEndTime] = useState<string>("");

	// error state
	const [errors, setErrors] = useState<
		Partial<Record<"unit" | "reason" | "startTime" | "endTime", string>>
	>({});

	// fetch site data
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

	// flatten to single CombinedUnit list
	const allUnits: CombinedUnit[] = useMemo(
		() =>
			sitesData.flatMap((loc) =>
				loc.sfomfrUnits.map((u) => ({
					...u,
					locationName: loc.locationName,
				}))
			),
		[sitesData]
	);

	// dropdown UI state
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);

	// close on outside click
	useEffect(() => {
		const handle = (e: MouseEvent) => {
			if (
				dropdownOpen &&
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [dropdownOpen]);

	// filter units
	const filteredUnits = useMemo(
		() =>
			allUnits.filter(
				(u) =>
					u.unitName
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					u.locationName
						.toLowerCase()
						.includes(searchTerm.toLowerCase())
			),
		[allUnits, searchTerm]
	);

	const selectedUnit = useMemo(
		() => allUnits.find((u) => u.unitId.toString() === unit),
		[allUnits, unit]
	);
	const movementDate: string = new Date().toISOString();

	const createdBy =
		getCookie("UserData") &&
		JSON.parse(getCookie("UserData") as string)?.employee_name;

	const empId =
		getCookie("UserData") &&
		JSON.parse(getCookie("UserData") as string)?.user_id;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Zod validation
		const result = relocateSchema.safeParse({
			unit,
			status,
			reason,
			startTime,
			endTime,
		});

		if (!result.success) {
			const fieldErrors: typeof errors = {};
			for (const err of result.error.errors) {
				const key = err.path[0] as keyof typeof fieldErrors;
				fieldErrors[key] = err.message;
			}
			setErrors(fieldErrors);
			return;
		}

		// clear old errors
		setErrors({});

		// build payload
		let payload = {};
		if (result.data.status === "1") {
			payload = {
				unitId: result.data.unit,
				status: result.data.status,
				reason: result.data.reason,
				movementDate,
				createdBy,
				empId,
			};
		} else {
			payload = {
				unitId: result.data.unit,
				status: result.data.status,
				startTime: toZuluISOString(result.data.startTime),
				endTime: toZuluISOString(result.data.endTime),
				movementDate,
				createdBy,
				empId,
			};
		}

		try {
			const res: { message: string; type: 1 | 0 } = await apiFetch<{
				type: 1 | 0;
				message: string;
			}>("/RMv2/mark-movement", {
				method: "POST",
				body: JSON.stringify(payload),
			});
			// if (res.success) {
			// 	toast.success("Employee relocated successfully!");
			// 	router.push("/dashboard");
			// } else {
			// 	toast.error("Failed to relocate employee.");
			// }

			if (res.type === 1) {
				toast.success("Employee relocated successfully!");
				router.push("/dashboard");
			} else {
				toast.error("Failed to relocate employee.");
			}
		} catch (err) {
			console.error(err);
			toast.error("An unexpected error occurred while relocating.");
		}
	};

	return (
		<div className="p-4 sm:p-6 flex justify-center w-full">
			<form
				onSubmit={handleSubmit}
				className="bg-white shadow rounded-lg p-6 w-full sm:w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 space-y-6"
			>
				<h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
					Relocate Employee
				</h2>

				{/* Unit select */}
				<div ref={containerRef} className="relative">
					<label className="block text-sm font-semibold text-gray-700 mb-1">
						Unit <span className="text-red-700">*</span>
					</label>
					<button
						type="button"
						onClick={() => {
							setDropdownOpen((o) => !o);
							setSearchTerm("");
						}}
						className="w-full h-10 px-3 cursor-pointer flex items-center justify-between border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
					>
						<span
							className={unit ? "text-gray-800" : "text-gray-400"}
						>
							{selectedUnit
								? selectedUnit.unitName
								: "Select unit or location..."}
						</span>
						<svg
							className={`w-5 h-5 transition-transform ${
								dropdownOpen ? "rotate-180" : "rotate-0"
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								d="M19 9l-7 7-7-7"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
					<AnimatePresence>
						{errors.unit && (
							<motion.p
								layout
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -5 }}
								className="text-red-600 text-xs mt-1"
							>
								{errors.unit}
							</motion.p>
						)}
					</AnimatePresence>

					<AnimatePresence>
						{dropdownOpen && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
								className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
							>
								<div className="p-2">
									<input
										type="text"
										autoFocus
										value={searchTerm}
										onChange={(e) =>
											setSearchTerm(e.target.value)
										}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												e.stopPropagation();
											}
										}}
										placeholder="Search unit or location..."
										className="w-full px-3 py-2 border  border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
									/>
								</div>
								<ul className="max-h-60 overflow-auto">
									{filteredUnits.length ? (
										filteredUnits.map((u, idx) => (
											<li
												key={`${u.locationId}-${u.unitId}-${idx}`}
											>
												<button
													type="button"
													onClick={() => {
														setUnit(
															u.unitId.toString()
														);
														setDropdownOpen(false);
													}}
													className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
												>
													<div className="flex items-center cursor-pointer  justify-between">
														<span className="font-medium text-gray-800">
															{u.unitName}
														</span>
														<span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-lg">
															{u.locationName}
														</span>
													</div>
												</button>
											</li>
										))
									) : (
										<li className="px-4 py-2 text-gray-500">
											No units found.
										</li>
									)}
								</ul>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Status */}
				<div>
					<label className="block text-sm font-semibold text-gray-700 mb-1">
						Status <span className="text-red-700">*</span>
					</label>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as "1" | "2")}
						className="w-full h-10 px-3 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-600"
					>
						<option className="cursor-pointer" value="1">
							Movement
						</option>
						<option className="cursor-pointer" value="2">
							Short Leave
						</option>
					</select>
				</div>

				{/* Conditional fields */}
				<AnimatePresence initial={false}>
					{status === "1" && (
						<motion.div
							key="movement"
							variants={fieldVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							transition={{ duration: 0.35, ease: "easeInOut" }}
							style={{ overflow: "hidden" }}
						>
							<label className="block text-sm font-semibold text-gray-700 mb-1">
								Reason / Remarks{" "}
								<span className="text-red-700">*</span>
							</label>
							<textarea
								value={reason}
								maxLength={100}
								onChange={(e) => setReason(e.target.value)}
								rows={4}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg "
							/>
							<div className="flex justify-between">
								<AnimatePresence>
									{errors.reason && (
										<motion.p
											layout
											initial={{ opacity: 0, y: -5 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -5 }}
											className="text-red-600 text-xs mt-1"
										>
											{errors.reason}
										</motion.p>
									)}
								</AnimatePresence>
								<p
									className={`text-xs text-gray-500 ${
										errors.reason ? "" : "w-full"
									} text-right`}
								>
									{reason.length}/100 characters
								</p>
							</div>
						</motion.div>
					)}

					{status === "2" && (
						<motion.div
							key="shortLeave"
							variants={fieldVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							transition={{ duration: 0.35, ease: "easeInOut" }}
							style={{ overflow: "hidden" }}
						>
							<div className="flex flex-col gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-1">
										Start Time{" "}
										<span className="text-red-700">*</span>
									</label>
									<input
										type="datetime-local"
										value={startTime}
										onChange={(e) =>
											setStartTime(e.target.value)
										}
										className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
									/>
									<AnimatePresence>
										{errors.startTime && (
											<motion.p
												layout
												initial={{ opacity: 0, y: -5 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -5 }}
												className="text-red-600 text-xs mt-1"
											>
												{errors.startTime}
											</motion.p>
										)}
									</AnimatePresence>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-1">
										End Time{" "}
										<span className="text-red-700">*</span>
									</label>
									<input
										type="datetime-local"
										value={endTime}
										onChange={(e) =>
											setEndTime(e.target.value)
										}
										className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
									/>
									<AnimatePresence>
										{errors.endTime && (
											<motion.p
												layout
												initial={{ opacity: 0, y: -5 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -5 }}
												className="text-red-600 text-xs mt-1"
											>
												{errors.endTime}
											</motion.p>
										)}
									</AnimatePresence>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Actions */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
					<button
						type="button"
						onClick={() => router.back()}
						className="w-full sm:w-auto px-4 py-2 cursor-pointer rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
					>
						Cancel
					</button>
					<button
						type="submit"
						className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#243972] to-[#cd2125] hover:from-[#cd2125] hover:to-[#1f355f] text-white font-medium rounded-lg cursor-pointer transition"
					>
						Submit
					</button>
				</div>
			</form>
		</div>
	);
};

export default RelocatePage;
