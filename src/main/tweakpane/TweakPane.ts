import { BaseBladeParams, BindingApi, BladeApi, FolderApi } from "@tweakpane/core";
import { BindingParams, FolderParams } from "@tweakpane/core/src/blade/common/api/params";
import { Pane } from "../../../libs/tweakpane-4.0.4";
import * as EssentialPlane from "../../../libs/tweakpane-plugin-essentials-0.2.1";

export class TweakPane {
    private mainPane!: FolderApi | Pane;

    public constructor(pane?: FolderApi | Pane) {
        if (pane) {
            this.mainPane = pane;
            return;
        }

        this.mainPane = new Pane();
        this.mainPane.registerPlugin(EssentialPlane);
    }

    public addParameter(data: { [P in string]: never }, name: string, options?: BindingParams): BindingApi {
        return this.mainPane.addBinding(data, name, options);
    }

    public addFolder(title: string, expanded = false): TweakPane {
        const folder = this.mainPane.addFolder({ title, expanded } as FolderParams) as FolderApi;
        return new TweakPane(folder);
    }

    public addBlade(params: BaseBladeParams): BladeApi {
        return this.mainPane.addBlade(params);
    }

    public addSeparator(): void {
        this.mainPane.addBlade({
            view: "separator"
        });
    }
}