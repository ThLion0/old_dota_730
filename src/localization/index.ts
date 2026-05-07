import { KeyValues } from "easy-keyvalues";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path"

import { LanguageRoot } from "./language_root.ts";

const LOCALIZATION_SOURCE_FOLDER = "locales";

function findLocalizationFiles(basePath: string): string[] {
    if (!existsSync(basePath)) return [];

    const filePaths: string[] = [];
    const stack: string[] = [basePath];

    while (stack.length > 0) {
        const currentPath = stack.pop()!;
        const entries = readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = join(currentPath, entry.name);

            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }

            if (entry.isFile() && entry.name.endsWith(".txt")) {
                filePaths.push(fullPath);
            }
        }
    }

    return filePaths;
}

async function main(): Promise<void> {
    const localizationRoot = join(import.meta.dirname, LOCALIZATION_SOURCE_FOLDER);
    const filePaths = findLocalizationFiles(localizationRoot);

    const data = await Promise.all(filePaths.map(filePath => KeyValues.Load(filePath)));

    for (const kv of data.flat()) {
        const language = kv.FindTraverse(kv => kv.Key === "Language")?.GetValue();
        if (language === undefined) continue;

        const tokens = kv.FindTraverse(kv => kv.Key === "Tokens");
        if (tokens === undefined) continue;

        LanguageRoot.GetRoot(language)
            .setTokens(tokens);
    }

    for (const language of LanguageRoot.GetLanguages()) {
        const fileName = `addon_${language.toLowerCase()}.txt`;
        const filePath = `game/resource/` + fileName;

        LanguageRoot.GetRoot(language).save(filePath);
    }
}

main();