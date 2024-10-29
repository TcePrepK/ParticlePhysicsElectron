import "../assets/style/style.scss";
import { FpsCounter } from "./core/FpsCounter";
import { fixEveryPreload } from "./core/HTMLUtils";
import { RecorderWebm } from "./core/RecorderWebm";
import { SubGrids } from "./game/SubGrids";
import { TweakPane } from "./tweakpane/TweakPane";

import { BrowserSupport } from "./ui/BrowserSupport";
import { ErrorScreen } from "./ui/ErrorScreen";

export class Main {
    private readonly fpsCounter = new FpsCounter();
    // private readonly quadTree = new QuadTree();
    private readonly subGrids = new SubGrids();

    private mainPane!: TweakPane;

    public initialize(): void {
        BrowserSupport.initialize();
        RecorderWebm.initialize();

        RecorderWebm.startRecording();

        this.mainPane = new TweakPane();
        this.fpsCounter.initialize(this.mainPane);

        this.mainPane.addParameter(this.subGrids, "pointAmount", { label: "Point Amount", readonly: true });

        this.preload();
        this.startRunning();
    }

    private preload(): void {
        fixEveryPreload();
        ErrorScreen.setInactive();
    }

    public startRunning(): void {
        const dt = this.fpsCounter.start() / 1000;

        this.subGrids.update(this.fpsCounter.AverageFPS);

        this.fpsCounter.stop();
        requestAnimationFrame(() => this.startRunning());
    }
}