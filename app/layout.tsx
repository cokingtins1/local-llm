import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeContextProvider from "@/lib/context/theme-context";
import ThemeSwitch from "@/lib/context/theme-switch";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "Local LLM Chat",
	description: "Chat with your local LLM models",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased flex justify-center mt-16 mx-auto max-w-[1440px] p-8 
					bg-gray-50 text-gray-950 dark:bg-gray-900 dark:text-opacity-90 dark:text-gray-50
					`}
			>
				<ThemeContextProvider>
					{children}

					<div className="fixed bottom-4 left-4 z-50">
						<ThemeSwitch />
					</div>
				</ThemeContextProvider>
			</body>
		</html>
	);
}
