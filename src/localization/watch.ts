import chokidar from 'chokidar';
import { spawn } from 'node:child_process';


const watcher = chokidar.watch('src/localization/.', {
    ignored: (path, stats) => stats?.isFile() === true && !path.endsWith('.txt'),
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
    .on('unlink', path => {
        console.clear();
        console.log(`🗑️ File ${path} has been removed`);
    });

function mergeLocaleFile(): void {
    console.log('🔄 Merging localization files...');

    const process = spawn("deno", ["-A", "src/localization/index.ts"], {
        stdio: "inherit"
    });

    process.on("close", (code) => {
        if (code === 0) {
            console.log('✅ Localization files merged successfully!');
        } else {
            console.error('❌ Failed to merge files');
        }
    });
}

process.on("SIGINT", () => {
    console.log('\n👋 Stopping watcher...');
    watcher.close();
    process.exit(0);
});

mergeLocaleFile();