import { reloadable } from "../lib/tstl-utils";

@reloadable
export class GoldFilter {
    public static filter(event: ModifyGoldFilterEvent): boolean {
        return true;
    }
}