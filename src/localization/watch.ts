import chokidar from "chokidar";
import { spawn } from "node:child_process";

const LOCALIZATION_SOURCE_FOLDER = "src/localization/locales";
const MERGE_SCRIPT_PATH = "src/localization/index.ts";

const watcher = chokidar.watch(LOCALIZATION_SOURCE_FOLDER, {
    ignored: (path, stats) => stats?.isFile() === true && !path.endsWith(".txt"),
    persistent: true,
    ignoreInitial: true,
});

let timeoutId: NodeJS.Timeout;

watcher
    .on("add", path => {
        console.clear();
        console.log(`📄 File ${path} has been added`);
    })
    .on("change", path => {
        console.clear();
        console.log(`📦 File ${path} changed`);

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            mergeLocaleFile();
        }, 300);
    })
    .on("unlink", path => {
        console.clear();
        console.log(`🗑️ File ${path} has been removed`);
    });

function mergeLocaleFile(): void {
    console.log("🔄 Merging localization files...");

    const mergeProcess = spawn("node", ["--experimental-strip-types", MERGE_SCRIPT_PATH], {
        stdio: "inherit"
    });

    mergeProcess.on("close", (mergeCode) => {
        if (mergeCode === 0) {
            console.log("✅ Localization files merged successfully!");
        } else {
            console.error("❌ Failed to merge localization files");
        }
    });

    mergeProcess.on("error", () => {
        console.error("❌ Failed to start localization merge process");
    });
}

process.on("SIGINT", () => {
    console.log("\n👋 Stopping watcher...");
    watcher.close();
    process.exit(0);
});

mergeLocaleFile();