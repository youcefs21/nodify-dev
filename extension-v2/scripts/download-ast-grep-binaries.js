// This script downloads all platform-specific .node files for ast-grep

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const { execSync } = require("node:child_process");

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, "../dist");
if (!fs.existsSync(distDir)) {
	fs.mkdirSync(distDir, { recursive: true });
}

// Define all the platform-specific packages we need
const platforms = [
	"darwin-arm64",
	"darwin-x64",
	"linux-arm64-gnu",
	"linux-x64-gnu",
	"win32-arm64-msvc",
	"win32-ia32-msvc",
	"win32-x64-msvc",
	"linux-arm64-musl",
	"linux-x64-musl",
];

// Get the version from package.json
const packageJson = require("../package.json");
let astGrepVersion =
	packageJson.dependencies["@ast-grep/napi"] ||
	packageJson.devDependencies["@ast-grep/napi"] ||
	"0.33.1"; // Fallback version

// Remove the caret if it exists since npm registry doesn't support semver ranges in URLs
if (astGrepVersion.startsWith("^")) {
	astGrepVersion = astGrepVersion.substring(1);
}

// Function to download a file
function downloadFile(url, dest) {
	return new Promise((resolve, reject) => {
		console.log(`Downloading from ${url} to ${dest}`);
		const file = fs.createWriteStream(dest);

		https
			.get(url, (response) => {
				if (response.statusCode !== 200) {
					reject(
						new Error(
							`Failed to download. Status code: ${response.statusCode}`,
						),
					);
					return;
				}

				response.pipe(file);

				file.on("finish", () => {
					file.close(resolve);
					console.log(`Downloaded ${dest} successfully`);
				});
			})
			.on("error", (err) => {
				fs.unlink(dest, () => {}); // Delete the file on error
				reject(err);
			});
	});
}

// Download all platform binaries
async function downloadAllBinaries() {
	console.log(`Downloading ast-grep binaries version ${astGrepVersion}`);

	const promises = platforms.map(async (platform) => {
		const fileName = `ast-grep-napi.${platform}.node`;
		const destPath = path.join(distDir, fileName);
		const npmRegistry = "https://registry.npmjs.org";

		try {
			const url = `${npmRegistry}/@ast-grep/napi-${platform}/-/napi-${platform}-${astGrepVersion}.tgz`;
			const tempTarPath = path.join(__dirname, `temp-${platform}.tgz`);

			// Download the tar file
			await downloadFile(url, tempTarPath);

			// Create a temp directory for extraction
			const tempExtractDir = path.join(__dirname, `temp-extract-${platform}`);
			if (fs.existsSync(tempExtractDir)) {
				fs.rmSync(tempExtractDir, { recursive: true, force: true });
			}
			fs.mkdirSync(tempExtractDir, { recursive: true });

			// Extract the tar file
			execSync(`tar -xzf ${tempTarPath} -C ${tempExtractDir}`);

			// Find and copy the .node file
			const extractedNodeFile = path.join(tempExtractDir, "package", fileName);

			if (fs.existsSync(extractedNodeFile)) {
				fs.copyFileSync(extractedNodeFile, destPath);
				console.log(`Copied ${fileName} to dist directory`);
			} else {
				// Try to find the file in the package directory
				const files = fs.readdirSync(path.join(tempExtractDir, "package"));
				console.log(`Contents of package directory for ${platform}:`, files);
				throw new Error(`Could not find ${fileName} in the extracted package`);
			}

			// Clean up
			fs.rmSync(tempTarPath, { force: true });
			fs.rmSync(tempExtractDir, { recursive: true, force: true });

			return { platform, success: true };
		} catch (error) {
			console.error(`Error downloading ${platform}:`, error);
			return { platform, success: false, error: error.message };
		}
	});

	const results = await Promise.all(promises);

	// Log the summary
	const successful = results.filter((r) => r.success).map((r) => r.platform);
	const failed = results.filter((r) => !r.success).map((r) => r.platform);

	console.log("\nSummary:");
	console.log(`Successfully downloaded: ${successful.length} platforms`);
	if (successful.length > 0) {
		console.log(`  - ${successful.join("\n  - ")}`);
	}

	if (failed.length > 0) {
		console.log(`\nFailed to download: ${failed.length} platforms`);
		console.log(`  - ${failed.join("\n  - ")}`);
	}
}

// Run the download process
downloadAllBinaries().catch(console.error);
