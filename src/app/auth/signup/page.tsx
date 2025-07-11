"use client";

import React, { useState, useEffect, FormEvent, FC, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

// ------------------------
// Type Definitions
// ------------------------
interface Unit {
	unitId: string;
	unitName: string;
}

interface Location {
	id: string;
	locationName: string;
	locationCode: string;
	createdBy: string;
	createdOn: string;
	modifiedBy: string | null;
	modifiedOn: string | null;
	sfomfrUnits: Unit[];
}

interface Department {
	id: string;
	dName: string;
}

interface RegistrationPayload {
	emailId: string;
	empCode: string;
	deptId: string;
	homeUnit: string;
	role: "User";
}

interface RegistrationResponse {
	type: number;
	data?: unknown;
	messages: string[];
	error?: string;
}

const signUpSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	empCode: z.string().regex(/^\d+$/, "Employee code must be a number"),
	deptId: z.string().nonempty("Please select a department"),
	homeUnit: z.string().nonempty("Please select a unit"),
});

enum Role {
	User = "User",
}

const SignUpPage: FC = () => {
	const [email, setEmail] = useState<string>("");
	const [empCode, setEmpCode] = useState<string>("");
	const [selectedDept, setSelectedDept] = useState<string>("");
	const [selectedLocationId, setSelectedLocationId] = useState<string>("");
	const [selectedUnit, setSelectedUnit] = useState<string>("");

	const [departments, setDepartments] = useState<Department[]>([]);
	const [locations, setLocations] = useState<Location[]>([]);
	const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);

	const [deptLoading, setDeptLoading] = useState<boolean>(true);
	const [locationLoading, setLocationLoading] = useState<boolean>(true);
	const [submitLoading, setSubmitLoading] = useState<boolean>(false);

	const [errors, setErrors] = useState<
		Partial<Record<"email" | "empCode" | "deptId" | "homeUnit", string>>
	>({});

	// Remove duplicates
	const uniqueDepartments = useMemo(
		() =>
			departments.filter(
				(d, i, arr) => arr.findIndex((x) => x.id === d.id) === i
			),
		[departments]
	);
	const uniqueLocations = useMemo(
		() =>
			locations.filter(
				(l, i, arr) => arr.findIndex((x) => x.id === l.id) === i
			),
		[locations]
	);

	// Fetch Departments
	useEffect(() => {
		const fetchDepartments = async () => {
			setDeptLoading(true);
			try {
				const res = await apiFetch<{ data: Department[] }>(
					"/RMv2/get-all-department",
					{ method: "GET" }
				);
				if (Array.isArray(res.data)) setDepartments(res.data);
			} catch (e) {
				console.error(e);
			} finally {
				setDeptLoading(false);
			}
		};
		fetchDepartments();
	}, []);

	// Fetch Locations
	useEffect(() => {
		const fetchLocations = async () => {
			setLocationLoading(true);
			try {
				const res = await apiFetch<{ data: Location[] }>(
					"/RMv2/get-all-locations",
					{ method: "GET" }
				);
				if (Array.isArray(res.data)) setLocations(res.data);
			} catch (e) {
				console.error(e);
			} finally {
				setLocationLoading(false);
			}
		};
		fetchLocations();
	}, []);

	// When location changes, update units under it
	useEffect(() => {
		if (!selectedLocationId) {
			setFilteredUnits([]);
			setSelectedUnit("");
			return;
		}

		const selectedLocation = locations.find((loc) => {
			return loc.id == selectedLocationId;
		});

		if (selectedLocation) {
			setFilteredUnits(selectedLocation.sfomfrUnits || []);
		} else {
			setFilteredUnits([]);
		}
		setSelectedUnit("");
	}, [selectedLocationId, locations]);

	// Handle submit
	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitLoading(true);
		setErrors({});

		const result = signUpSchema.safeParse({
			email,
			empCode,
			deptId: selectedDept,
			homeUnit: selectedUnit,
		});
		if (!result.success) {
			const fieldErrors: typeof errors = {};
			result.error.errors.forEach((err) => {
				const key = err.path[0] as keyof typeof fieldErrors;
				fieldErrors[key] = err.message;
			});
			setErrors(fieldErrors);
			setSubmitLoading(false);
			return;
		}

		const payload: RegistrationPayload = {
			emailId: email,
			empCode: empCode,
			deptId: selectedDept,
			homeUnit: selectedUnit,
			role: Role.User,
		};

		try {
			const res = await apiFetch<RegistrationResponse>(
				"/RMv2/user_registration",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);
			const raw = res.messages[0] || "";
			const msg = raw.replace(
				/^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2}\s:\s*/,
				""
			);
			if (res.type === 1) {
				toast.success("Registration successful!");
				setEmail("");
				setEmpCode("");
				setSelectedDept("");
				setSelectedLocationId("");
				setSelectedUnit("");
			} else {
				toast.error(msg || "Registration failed");
			}
		} catch (e) {
			console.error(e);
		} finally {
			setSubmitLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 p-6 md:p-10">
			{/* Header */}
			<div className="flex justify-center md:justify-start gap-2">
				<Link href="/" className="flex items-center gap-2 font-medium">
					<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="size-4"
						>
							<path d="M7 2h10" />
							<path d="M5 6h14" />
							<rect width="18" height="12" x="3" y="10" rx="2" />
						</svg>
					</div>
					Tracker.io
				</Link>
			</div>

			{/* Form */}
			<form
				onSubmit={handleSubmit}
				className="flex flex-col items-center"
			>
				<div className="w-full max-w-xs">
					<h1 className="text-2xl font-bold text-center mb-2">
						Sign Up for an Account
					</h1>
					<p className="text-muted-foreground text-sm text-center mb-6">
						Enter your details below to create an account
					</p>
					<div className="grid gap-4">
						{/* Email */}
						<div className="flex flex-col">
							<label
								htmlFor="email"
								className="text-sm font-semibold mb-1"
							>
								Email <span className="text-red-600">*</span>
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								className="w-full h-9 px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
							/>
							<AnimatePresence>
								{errors.email && (
									<motion.p
										layout
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -5 }}
										className="text-red-600 text-xs mt-1"
									>
										{errors.email}
									</motion.p>
								)}
							</AnimatePresence>
						</div>
						{/* Employee Code */}
						<div className="flex flex-col">
							<label
								htmlFor="employeeCode"
								className="text-sm font-semibold mb-1"
							>
								Employee Code{" "}
								<span className="text-red-600">*</span>
							</label>
							<input
								id="employeeCode"
								type="text"
								value={empCode}
								onChange={(e) => setEmpCode(e.target.value)}
								placeholder="Enter your employee code"
								className="w-full h-9 px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
							/>
							<AnimatePresence>
								{errors.empCode && (
									<motion.p
										layout
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -5 }}
										className="text-red-600 text-xs mt-1"
									>
										{errors.empCode}
									</motion.p>
								)}
							</AnimatePresence>
						</div>
						{/* Department */}
						<div className="flex flex-col">
							<label
								htmlFor="department"
								className="text-sm font-semibold mb-1"
							>
								Department{" "}
								<span className="text-red-600">*</span>
							</label>
							<select
								id="department"
								value={selectedDept}
								onChange={(e) =>
									setSelectedDept(e.target.value)
								}
								disabled={deptLoading}
								className="w-full h-9 px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
							>
								<option className="text-sm " value="">
									{deptLoading
										? "Loading..."
										: "Select department"}
								</option>
								{uniqueDepartments.map((d) => (
									<option
										className="text-sm "
										key={`${d.id}-${d.dName}`}
										value={d.id}
									>
										{d.dName}
									</option>
								))}
							</select>
							<AnimatePresence>
								{errors.deptId && (
									<motion.p
										layout
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -5 }}
										className="text-red-600 text-xs mt-1"
									>
										{errors.deptId}
									</motion.p>
								)}
							</AnimatePresence>
						</div>
						{/* Location */}
						<div className="flex flex-col">
							<label
								htmlFor="location"
								className="text-sm font-semibold mb-1"
							>
								Location <span className="text-red-600">*</span>
							</label>
							<select
								id="location"
								value={selectedLocationId}
								onChange={(e) =>
									setSelectedLocationId(e.target.value)
								}
								disabled={locationLoading}
								className="w-full h-9 px-3 py-1  rounded-md bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
							>
								<option className="text-sm " value="">
									{locationLoading
										? "Loading..."
										: "Select location"}
								</option>
								{uniqueLocations.map((loc) => (
									<option
										className="text-sm "
										key={loc.id}
										value={loc.id}
									>
										{loc.locationName}
									</option>
								))}
							</select>
						</div>
						{/* Unit */}
						<div className="flex flex-col">
							<label
								htmlFor="unit"
								className="text-sm font-semibold mb-1"
							>
								Unit <span className="text-red-600">*</span>
							</label>
							<select
								id="unit"
								value={selectedUnit}
								onChange={(e) =>
									setSelectedUnit(e.target.value)
								}
								disabled={!filteredUnits.length}
								className="w-full h-9 px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
							>
								<option className="text-sm " value="">
									{!filteredUnits.length
										? "Select location first"
										: "Select unit"}
								</option>
								{filteredUnits.map((u) => (
									<option
										className="text-sm "
										key={u.unitId}
										value={u.unitId}
									>
										{u.unitName}
									</option>
								))}
							</select>
							<AnimatePresence>
								{errors.homeUnit && (
									<motion.p
										layout
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -5 }}
										className="text-red-600 text-xs mt-1"
									>
										{errors.homeUnit}
									</motion.p>
								)}
							</AnimatePresence>
						</div>
						<button
							type="submit"
							disabled={submitLoading}
							className="w-full mt-4 bg-gradient-to-r from-[#243972] to-[#cd2125] text-white font-medium py-2 rounded-md shadow transition hover:from-[#cd2125] hover:to-[#1f355f] disabled:opacity-50"
						>
							{submitLoading ? "Submitting..." : "Sign Up"}
						</button>
						<p className="text-muted-foreground text-center text-sm mt-2">
							Already have an account?{" "}
							<Link
								href="/auth/login"
								className="text-blue-600 hover:underline"
							>
								Login
							</Link>
						</p>
					</div>
				</div>
			</form>
		</div>
	);
};

export default SignUpPage;
