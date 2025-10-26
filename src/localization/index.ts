import settings from "./settings.ts";

import { KeyValues } from "easy-keyvalues";
import { readdirSync } from "node:fs";
import { join } from "node:path"

import { LanguageRoot } from "./language_root.ts";


async function main(): Promise<void> {
    const data = await Promise.all(
        settings.folders.map(
            folder => Promise.all(
                readdirSync(join(import.meta.dirname, folder)).map(
                    path => KeyValues.Load(join(import.meta.dirname, folder, path))
                )
            )
        )
    );

    for (const kv of data.flat()) {
        const language = kv.FindTraverse(kv => kv.Key === "Language")?.GetValue();
        if (language === undefined) continue;

        const tokens = kv.FindTraverse(kv => kv.Key === "Tokens");
        if (tokens === undefined) continue;

        const category = kv.FindTraverse(kv => kv.Key === "Category")?.GetValue();

        const fileName = `addon_${language.toLowerCase()}.txt`;
        const filePath = `game/resource/` + fileName;

        LanguageRoot.getRoot(language)
            .setTokens(tokens.toObject(), category)
            .save(filePath);
    }
}

main();