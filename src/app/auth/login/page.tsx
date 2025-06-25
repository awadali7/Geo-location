"use client";

import React, { useState, FormEvent, FC } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { UserData, useUserStore } from "@/lib/store";

// ------------------------
// Zod Schema
// ------------------------
const loginSchema = z.object({
	username: z.string().nonempty("Username is required"),
	password: z.string().nonempty("Password is required"),
});

interface LoginResponse {
	type: number;
	messages?: string[];
	data?: UserData;
	error?: string;
}

const LoginPage: FC = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<
		Partial<Record<"username" | "password", string>>
	>({});

	const router = useRouter();
	const setUserData = useUserStore((state) => state.setUserData);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setErrors({});

		// 1) Validate form data
		const result = loginSchema.safeParse({ username, password });
		if (!result.success) {
			const fieldErrors: typeof errors = {};
			result.error.errors.forEach((err) => {
				const key = err.path[0] as keyof typeof fieldErrors;
				fieldErrors[key] = err.message;
			});
			setErrors(fieldErrors);
			setLoading(false);
			return;
		}

		// 2) Build query-string
		const qs = `?username=${encodeURIComponent(
			username
		)}&password=${encodeURIComponent(password)}`;

		try {
			// 3) Call API
			const res = await apiFetch<LoginResponse>(`/v2/auth-user${qs}`, {
				method: "POST",
			});

			const raw = res.messages?.[0] || res.error || "";
			const msg = raw.replace(
				/^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2}\s:\s*/,
				""
			);

			if (res.type === 1 && res.data) {
				// ✅ Store as string in cookie
				setCookie("UserData", JSON.stringify(res.data));

				// ✅ Store in Zustand as object
				setUserData(res.data);

				toast.success("Login successful");
				router.push("/dashboard");
			} else {
				toast.error(msg || "Login failed");
			}
		} catch (err) {
			console.error(err);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 p-6 md:p-10">
			<div className="flex justify-center gap-2 md:justify-start">
				<Link href="/" className="flex items-center gap-2 font-medium">
					<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="lucide-gallery-vertical-end size-4"
						>
							<path d="M7 2h10" />
							<path d="M5 6h14" />
							<rect width="18" height="12" x="3" y="10" rx="2" />
						</svg>
					</div>
					Tracker.io
				</Link>
			</div>

			<div className="flex flex-1 items-center justify-center">
				<div className="w-full max-w-xs">
					<form onSubmit={handleSubmit} className="flex flex-col">
						<div className="flex flex-col items-center gap-2 mb-6 text-center">
							<h1 className="text-2xl font-bold">
								Login to your account
							</h1>
							<p className="text-muted-foreground text-sm">
								Enter your username below to login
							</p>
						</div>

						<div className="grid gap-6">
							{/* Username */}
							<div className="flex flex-col">
								<label
									htmlFor="username"
									className="text-sm font-medium"
								>
									Username
								</label>
								<input
									id="username"
									type="text"
									value={username}
									onChange={(e) =>
										setUsername(e.target.value)
									}
									placeholder="Enter your username"
									className="w-full h-9 px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
								/>
								<AnimatePresence>
									{errors.username && (
										<motion.p
											layout
											initial={{ opacity: 0, y: -5 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -5 }}
											className="text-red-600 text-xs mt-1"
										>
											{errors.username}
										</motion.p>
									)}
								</AnimatePresence>
							</div>

							{/* Password */}
							<div className="flex flex-col">
								<label
									htmlFor="password"
									className="text-sm font-medium"
								>
									Password
								</label>
								<input
									id="password"
									type="password"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									placeholder="Enter your password"
									className="w-full h-9 px-3 py-1 rounded-md bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
								/>
								<AnimatePresence>
									{errors.password && (
										<motion.p
											layout
											initial={{ opacity: 0, y: -5 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -5 }}
											className="text-red-600 text-xs mt-1"
										>
											{errors.password}
										</motion.p>
									)}
								</AnimatePresence>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="mt-6 mb-4 bg-gradient-to-r from-[#243972] to-[#cd2125] text-white font-medium py-2 px-4 rounded-md shadow cursor-pointer transition hover:from-[#cd2125] hover:to-[#1f355f] disabled:opacity-50"
						>
							{loading ? "Logging in..." : "Login"}
						</button>

						<p className="text-muted-foreground text-center text-sm">
							Don&apos;t have an account?{" "}
							<Link
								href="/auth/signup"
								className="text-blue-600 hover:underline"
							>
								Sign up
							</Link>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
