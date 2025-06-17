"use client";

import React, { useState, useEffect, useRef, FC } from "react";
import { getCookie, deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { FaSignOutAlt, FaUserCircle, FaUserEdit } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { getFirstTwoLetters } from "@/utils/funtions";
import { FaMapLocationDot } from "react-icons/fa6";

const Header: FC = () => {
	const router = useRouter();
	const [userName, setUserName] = useState<string>("");
	const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const cookie = getCookie("UserData");
		try {
			const userData = JSON.parse(
				typeof cookie === "string" ? cookie : "{}"
			);
			setUserName(userData.user_name || "");
		} catch {
			setUserName("");
		}
	}, []);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleLogout = () => {
		deleteCookie("UserData");
		router.push("/auth/login");
	};

	const handleProfile = () => {
		router.push("/profile/update");
	};

	const initials = userName ? (
		getFirstTwoLetters(userName)
	) : (
		<FaUserCircle className="text-2xl text-gray-600" />
	);

	return (
		<header className="flex h-16 items-center justify-between px-6 bg-white border-b border-gray-200">
			{/* Logo & Title */}
			<div className="flex items-center gap-2">
				<FaMapLocationDot className="text-2xl text-primary" />
				<span className="text-xl font-semibold text-gray-800">
					Tracker.io
				</span>
			</div>

			{/* Avatar & Dropdown */}
			<div className="relative" ref={dropdownRef}>
				<button
					onClick={() => setDropdownOpen((prev) => !prev)}
					className="flex items-center justify-center w-10 cursor-pointer border border-gray-200 h-10 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
				>
					{initials}
				</button>

				<AnimatePresence>
					{dropdownOpen && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: -10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: -10 }}
							transition={{ duration: 0.2 }}
							className="absolute right-0 mt-3 w-44 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 origin-top-right"
						>
							{/* Arrow */}
							<div className="absolute top-0 right-4 -mt-2 h-2 w-2 bg-white rotate-45 border-l border-t border-gray-200"></div>

							<ul className="divide-y divide-gray-100">
								<li>
									<button
										onClick={handleProfile}
										className="flex items-center gap-2 cursor-pointer w-full px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
									>
										<FaUserEdit />
										<span className="text-sm">Profile</span>
									</button>
								</li>
								<li>
									<button
										onClick={handleLogout}
										className="flex items-center cursor-pointer gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition"
									>
										<FaSignOutAlt className="text-red-600" />
										<span className="text-sm">Logout</span>
									</button>
								</li>
							</ul>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</header>
	);
};

export default Header;
