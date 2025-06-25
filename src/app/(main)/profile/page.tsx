"use client";

import React, { useEffect, useState, FC } from "react";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiHash, FiMapPin } from "react-icons/fi";
import { useUserStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";

interface LocationApi {
	id: number;
	locationName: string;
	sfomfrUnits: {
		unitId: number;
		unitName: string;
	}[];
}

const ProfilePage: FC = () => {
	const userData = useUserStore((state) => state.userData);
	const [currentLocation, setCurrentLocation] = useState<string | null>(null);

	useEffect(() => {
		if (!userData?.homeUnitId) return;

		apiFetch<{ data: LocationApi[] }>("/RMv2/get-all-locations")
			.then((res) => {
				for (const location of res.data) {
					const match = location.sfomfrUnits.find(
						(unit) => unit.unitId === userData.homeUnitId
					);
					if (match) {
						setCurrentLocation(
							`${location.locationName} - ${match.unitName}`
						);
						break;
					}
				}
			})
			.catch((err) => {
				console.error("Failed to fetch location data", err);
			});
	}, [userData?.homeUnitId]);

	if (!userData) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<span className="text-gray-500 text-lg font-medium">
					Loading profile…
				</span>
			</div>
		);
	}

	const { employee_name, user_name, email } = userData;

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="flex flex-col items-center justify-start min-h-screen bg-gray-100 py-12 px-4 md:px-8 lg:px-16"
		>
			<div className="w-full max-w-lg bg-white rounded-xl border border-gray-300 shadow-md p-6 md:p-8">
				<h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8 border-b pb-3 md:pb-4">
					My Profile
				</h1>

				<div className="space-y-5 md:space-y-6">
					<ProfileItem
						icon={<FiUser />}
						label="Full Name"
						value={employee_name}
					/>
					<ProfileItem
						icon={<FiHash />}
						label="Username"
						value={user_name}
					/>
					<ProfileItem
						icon={<FiMail />}
						label="Email"
						value={email}
					/>
					{currentLocation && (
						<ProfileItem
							icon={<FiMapPin />}
							label="Current Location"
							value={currentLocation}
						/>
					)}
				</div>
			</div>
		</motion.div>
	);
};

const ProfileItem: FC<{
	icon: React.ReactNode;
	label: string;
	value: string | number;
}> = ({ icon, label, value }) => (
	<div className="flex items-start sm:items-center gap-3 sm:gap-4">
		<div className="text-gray-500 text-xl sm:text-2xl">{icon}</div>
		<div>
			<p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">
				{label}
			</p>
			<p className="text-gray-800 font-semibold break-all">{value}</p>
		</div>
	</div>
);

export default ProfilePage;
