/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	eslint: {
		// Disable ESLint during builds (production only)
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Disable TypeScript errors during builds (production only)
		ignoreBuildErrors: true,
	},
	webpack: (config, _) => ({
		...config,
		watchOptions: {
			...config.watchOptions,
			poll: 800,
			aggregateTimeout: 300,
		},
	}),
};

export default nextConfig;
