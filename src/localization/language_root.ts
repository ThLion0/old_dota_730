import { KeyValues } from "easy-keyvalues";
import { writeFile } from "node:fs";


type LanguageTokens = { [key: string]: string };

export class LanguageRoot {
    private static roots = new Map<string, LanguageRoot>();

    private KV: KeyValues;
    private tokens: KeyValues;

    private constructor(language: string) { 
        this.KV = KeyValues.CreateRoot();

        const lang = this.KV.CreateChild(
            "lang",
            [ new KeyValues("Language", language) ]
        );

        this.tokens = lang.CreateChild("Tokens", []);
    }

    public setTokens(tokens: LanguageTokens, category: string | undefined): LanguageRoot {
        Object.entries(tokens)
            .map(([key, value]) => new KeyValues(key, value))
            .forEach((token, index) => {
                this.tokens.Append(token);
                
                if (index === 0 && category !== undefined) {
                    token.Comments.AppendComment(category.toUpperCase());
                }
            });
        
        return this;
    }

    public save(filePath: string): void {
        writeFile(filePath, "", () => {
            this.KV.Save(filePath);
        });
    }

    static getRoot(language: string): LanguageRoot {
        if (this.roots.has(language)) {
            return this.roots.get(language)!;
        }

        const root = new LanguageRoot(language);
        this.roots.set(language, root);
        return root;
    }
}