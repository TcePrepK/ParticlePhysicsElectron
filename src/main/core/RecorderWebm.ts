import { getElementById } from "./HTMLUtils";

export class RecorderWebm {
    private static canvas: HTMLCanvasElement;

    private static chunks: Blob[] = [];
    private static mediaRecorder: MediaRecorder;

    private static startBtn: HTMLButtonElement;
    private static stopBtn: HTMLButtonElement;

    public static initialize(): void {
        this.startBtn = getElementById("start-btn")! as HTMLButtonElement;
        this.stopBtn = getElementById("stop-btn")! as HTMLButtonElement;
        this.canvas = getElementById("record-canvas") as HTMLCanvasElement;

        this.startBtn.onclick = this.startRecording.bind(this);
        this.stopBtn.onclick = this.stopRecording.bind(this);
    }

    public static startRecording(): void {
        // Capture canvas as a media stream
        const stream = this.canvas.captureStream(30); // 30 FPS recording
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

        // When data is available, push it to an array
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };

        // When the recording stops, save the video file
        this.mediaRecorder.onstop = this.saveRecording.bind(this);

        this.mediaRecorder.start(); // Start recording
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
    }

    private static async stopRecording(): Promise<void> {
        this.mediaRecorder.stop(); // Stop recording
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
    }

    private static saveRecording(): void {
        // Create a blob from the recorded chunks
        const blob = new Blob(this.chunks, { type: "video/webm" });
        this.chunks = [];

        // Create a download link for the video
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "canvas-recording.webm";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Release the blob URL
        URL.revokeObjectURL(url);
    }
}