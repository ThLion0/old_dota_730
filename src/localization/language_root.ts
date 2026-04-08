import { KeyValues } from "easy-keyvalues";
import { writeFile } from "node:fs";


export class LanguageRoot {
    private static readonly rootMap = new Map<string, LanguageRoot>();

    private readonly KV: KeyValues;
    private readonly tokens: KeyValues;

    private constructor(language: string) { 
        this.KV = KeyValues.CreateRoot();

        const lang = this.KV.CreateChild(
            "lang",
            [ new KeyValues("Language", language) ]
        );

        this.tokens = lang.CreateChild("Tokens", []);

        lang.Comments.AppendComment("Localization file has been generated using custom script");
    }

    public static GetRoot(language: string): LanguageRoot {
        if (this.rootMap.has(language)) {
            return this.rootMap.get(language)!;
        }

        const root = new LanguageRoot(language);
        this.rootMap.set(language, root);
        return root;
    }

    public setTokens(tokens: KeyValues): LanguageRoot {
        tokens.GetChildren().forEach(child => {
            if (child.Comments.HasComments()) {
                this.tokens.Append(KeyValues.CreateRoot());
            }
            
            this.tokens.Append(child);
        });

        return this;
    }

    public save(filePath: string): void {
        writeFile(filePath, "", () => {
            this.KV.Save(filePath);
        });
    }
}