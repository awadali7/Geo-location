import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
	dest: "public",
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === "development", // disable PWA in dev
});

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "nestdigital.com",
				port: "",
				pathname: "/wp-content/uploads/**",
			},
		],
		/* config options here */
	},
};

module.exports = withPWA(nextConfig);
