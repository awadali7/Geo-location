import Image from "next/image";
import SfoLogo from "@/../public/sfo_logo.png";
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="bg-background">
			<div className="grid min-h-svh lg:grid-cols-2">
				{/* LEFT SIDE */}
				{children}
				{/* RIGHT SIDE */}
				<div className="bg-muted relative  lg:block">
					<Image
						src={SfoLogo}
						width={500}
						height={500}
						alt="Image"
						className="
					  absolute top-1/2 left-1/2
					  -translate-x-1/2 -translate-y-1/2
					"
					/>
				</div>
			</div>
		</div>
	);
}
