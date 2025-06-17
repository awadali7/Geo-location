import type { NextConfig } from "next";

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

export default nextConfig;
