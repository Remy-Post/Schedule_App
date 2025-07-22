// Bundle analyzer script for optimizing build size
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const path = require("path");

// This script analyzes the production bundle
// Run with: npm run analyze
if (process.env.ANALYZE === "true") {
  const analyzer = new BundleAnalyzerPlugin({
    analyzerMode: "server",
    openAnalyzer: true,
    analyzerHost: "localhost",
    analyzerPort: 8888,
    reportFilename: path.resolve(__dirname, "bundle-report.html"),
    defaultSizes: "parsed",
    generateStatsFile: true,
    statsFilename: path.resolve(__dirname, "bundle-stats.json"),
    logLevel: "info",
  });

  console.log("Bundle analyzer will start after build completes...");
  console.log("Visit http://localhost:8888 to view the bundle analysis");
}
