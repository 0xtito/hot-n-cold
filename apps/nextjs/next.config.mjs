/* eslint @typescript-eslint/no-unsafe-call: 0 */ // for config, config defined as any
/* eslint @typescript-eslint/no-unsafe-member-access: 0 */ // for module
/* eslint @typescript-eslint/no-unsafe-return: 0 */ // for config return

/* eslint-disable */

import "./src/env.mjs";

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: [
    "three",
    "@react-three/uikit",
    "@vixuslabs/newtonxr",
    "@zkarcade/db",
    "@zkarcade/api",
    "@zkarcade/mina",
  ],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.glsl/,
      loader: "webpack-glsl-loader",
    });

    config.experiments = { ...config.experiments, topLevelAwait: true };

    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default config;
