"use client";

import { useEffect } from "react";
import { useUserStore } from "./store";

export default function InitUser() {
	const hydrate = useUserStore((s) => s.hydrateUserData);

	useEffect(() => {
		hydrate();
	}, [hydrate]);

	return null;
}
