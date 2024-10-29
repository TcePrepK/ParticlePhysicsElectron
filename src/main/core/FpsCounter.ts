import { FpsGraphBladeApi } from "@tweakpane/plugin-essentials";
import { TweakPane } from "../tweakpane/TweakPane";

export class FpsCounter {
    private lastTime: number = performance.now();
    public FPS = 0;
    public AverageFPS = 120;

    public FPSGraph!: FpsGraphBladeApi;

    public initialize(pane: TweakPane): void {
        this.FPSGraph = pane.addBlade({
            view: "fpsgraph",
            rows: 2,

            interval: 200,
            min: 0,
            max: 120
        }) as FpsGraphBladeApi;
        pane.addParameter(this, "AverageFPS", { readonly: true });
    }

    public start(): number {
        const now = performance.now();
        const dt = now - this.lastTime;

        this.lastTime = now;
        this.FPS = 1000 / dt;

        this.AverageFPS = (this.FPS + this.AverageFPS) / 2;

        this.FPSGraph.begin();
        return dt;
    }

    public stop(): void {
        this.FPSGraph.end();
    }
}