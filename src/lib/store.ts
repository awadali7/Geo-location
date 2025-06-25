// lib/userStore.ts
import { create } from "zustand";
import { setCookie, getCookie } from "cookies-next";

export interface Token {
	accessToken: string;
	tokenExpiresOn: string;
	tokenType: string;
}

export interface UserData {
	user_name: string;
	employee_name: string;
	token: Token;
	user_id: number;
	email: string;
	last_login_time: string;
	userrole: string;
	homeUnitId: number;
}

interface UserStore {
	userData: UserData | null;
	setUserData: (data: UserData) => void;
	updateUserData: (partial: Partial<UserData>) => void;
	syncUserData: (partial: Partial<UserData>) => void;
	clearUserData: () => void;
	hydrateUserData: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
	userData: null,

	setUserData: (data) => {
		set({ userData: data });
		setCookie("UserData", JSON.stringify(data));
	},

	updateUserData: (partial) =>
		set((state) => ({
			userData: state.userData ? { ...state.userData, ...partial } : null,
		})),

	syncUserData: (partial) => {
		const current = get().userData;
		if (!current) return;

		const updated = { ...current, ...partial };
		set({ userData: updated });
		setCookie("UserData", JSON.stringify(updated));
	},

	clearUserData: () => {
		set({ userData: null });
		setCookie("UserData", "", { maxAge: -1 }); // delete cookie
	},

	hydrateUserData: () => {
		const cookie = getCookie("UserData");
		if (typeof cookie === "string") {
			try {
				const parsed = JSON.parse(cookie);
				set({ userData: parsed });
			} catch (err) {
				console.error("Invalid UserData cookie:", err);
			}
		}
	},
}));
