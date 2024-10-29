import { getElementById } from "../core/HTMLUtils";

export class SubGrids {
    private size = 800;

    private pointAmount = 0;
    private subGridSize = 40;

    private readonly axisGridAmount = Math.floor(this.size / this.subGridSize);
    private readonly totalGridAmount = this.axisGridAmount * this.axisGridAmount;

    private under60FPS = false;

    private lastIndex = 0;
    private arr: number[] = [];
    private readonly pointList: Array<{
        x: number,
        y: number,
        px: number,
        py: number,
        r: number
    }> = [];

    private readonly ctx!: CanvasRenderingContext2D;

    constructor() {
        const canvas = getElementById("record-canvas") as HTMLCanvasElement;
        canvas.width = this.size;
        canvas.height = this.size;

        canvas.addEventListener("click", (event) => {
            const x = event.clientX - canvas.offsetLeft;
            const y = event.clientY - canvas.offsetTop;

            this.pointList.push({ x: x, y: y, px: x, py: y, r: 5 });
            this.pointAmount++;
        });

        this.ctx = canvas.getContext("2d")!;
    }

    private handlePhysics(dt: number): void {
        // const accX = 0;
        // const accY = 1000;

        for (const point of this.pointList) {
            const dx = point.x - this.size / 2;
            const dy = point.y - this.size / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const accX = -dx / dist * 1000;
            const accY = -dy / dist * 1000;

            const nextX = point.x + (point.x - point.px) * 0.999 + accX * dt * dt;
            const nextY = point.y + (point.y - point.py) * 0.999 + accY * dt * dt;

            point.px = point.x;
            point.py = point.y;
            point.x = nextX;
            point.y = nextY;
        }
    }

    private handleCollisionOld(): void {
        for (let i = 0; i < this.pointList.length; i++) {
            const pointA = this.pointList[i];
            for (let j = i + 1; j < this.pointList.length; j++) {
                const pointB = this.pointList[j];

                const dx = pointA.x - pointB.x;
                const dy = pointA.y - pointB.y;
                const tr = pointA.r + pointB.r;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > tr) continue;

                const massRatioA = pointA.r / tr;
                const massRatioB = pointB.r / tr;

                const delta = 0.5 * (tr - dist);

                pointA.x += dx / dist * delta * massRatioA;
                pointA.y += dy / dist * delta * massRatioA;
                pointB.x -= dx / dist * delta * massRatioB;
                pointB.y -= dy / dist * delta * massRatioB;
            }
        }
    }

    private getGridIndex(x: number, y: number): number {
        if (x < 0 || x >= this.axisGridAmount || y < 0 || y >= this.axisGridAmount) return -1;

        let root = 0;
        for (let gridY = 0; gridY < this.axisGridAmount; gridY++) {
            for (let gridX = 0; gridX < this.axisGridAmount; gridX++) {
                if (gridX === x && gridY === y) return root;
                root += this.arr[root] + 1;
            }
        }

        return -1;
    }

    private getNextGrid(index: number): number {
        if (index < 0 || index >= this.arr.length) return -1;

        return index + this.arr[index] + 1;
    }

    private getGridParticles(index: number): number[] {
        if (index < 0) return [];

        const amount = this.arr[index];
        const arr = [];

        for (let i = 0; i < amount; i++) {
            arr.push(this.arr[index + i + 1]);
        }

        return arr;
    }

    private handleCollision(): void {
        this.constructGrids();

        let root = 0;
        for (let gridCounter = 0; gridCounter < this.totalGridAmount; gridCounter++) {
            const amount = this.arr[root];
            if (amount === 0) {
                root += amount + 1;
                continue;
            }

            const x = gridCounter % this.axisGridAmount;
            const y = Math.floor(gridCounter / this.axisGridAmount);

            const topLeft = this.getGridIndex(x - 1, y - 1);
            const left = this.getGridIndex(x - 1, y);
            const bottomLeft = this.getGridIndex(x - 1, y + 1);

            const top = this.getNextGrid(topLeft);
            const bottom = this.getNextGrid(bottomLeft);

            const topRight = this.getNextGrid(top);
            const right = this.getNextGrid(this.getNextGrid(left));
            const bottomRight = this.getNextGrid(bottom);

            const mainParticles = this.getGridParticles(root);
            const allParticles =
                [
                    ...mainParticles,
                    ...this.getGridParticles(topLeft),
                    ...this.getGridParticles(top),
                    ...this.getGridParticles(topRight),
                    ...this.getGridParticles(left),
                    ...this.getGridParticles(right),
                    ...this.getGridParticles(bottomLeft),
                    ...this.getGridParticles(bottom),
                    ...this.getGridParticles(bottomRight)
                ]

            for (const pointAI of mainParticles) {
                for (const pointBI of allParticles) {
                    if (pointAI === pointBI) continue;

                    const pointA = this.pointList[pointAI];
                    const pointB = this.pointList[pointBI];

                    const dx = pointA.x - pointB.x;
                    const dy = pointA.y - pointB.y;
                    const tr = pointA.r + pointB.r;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > tr) continue;

                    const massRatioA = pointA.r / tr;
                    const massRatioB = pointB.r / tr;

                    const delta = 0.5 * (tr - dist);

                    pointA.x += dx / dist * delta * massRatioA;
                    pointA.y += dy / dist * delta * massRatioA;
                    pointB.x -= dx / dist * delta * massRatioB;
                    pointB.y -= dy / dist * delta * massRatioB;
                }
            }

            root += amount + 1;
        }
    }

    private handleConstrains(): void {
        for (const point of this.pointList) {
            const center = this.size / 2;

            const dx = point.x - center;
            const dy = point.y - center;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.size / 2 - point.r) {
                point.x = center + dx / dist * (this.size / 2 - point.r);
                point.y = center + dy / dist * (this.size / 2 - point.r);
            }
        }
    }

    public update(fps: number): void {
        const subSteps = 2;

        if (fps > 60) {
            const x = this.size / 4;
            const y = this.size / 4;
            this.pointList.push({ x: x, y: y, px: x - 2 * 10 / subSteps, py: y, r: Math.random() * 5 + 5 });
            this.pointAmount++;
        } else {
            this.under60FPS = true;
        }

        for (let i = 0; i < subSteps; i++) {
            this.handleCollision();
            this.handleConstrains();
            this.handlePhysics((1 / 60) / subSteps);
        }

        this.renderQuad();
    }

    private renderQuad(): void {
        const ctx = this.ctx;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, this.size, this.size);

        for (let i = 0; i < this.pointList.length; i++) {
            const point = this.pointList[i];

            ctx.fillStyle = "#0f0";
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.r, 0, 2 * Math.PI);
            ctx.fill();
        }

        // let root = 0;
        // for (let gridCounter = 0; gridCounter < this.totalGridAmount; gridCounter++) {
        //     const x = gridCounter % this.axisGridAmount;
        //     const y = Math.floor(gridCounter / this.axisGridAmount);
        //     const s = this.subGridSize;
        //
        //     const amount = this.arr[root++];
        //     root += amount;
        //
        //     ctx.fillStyle = `rgb(255, 255, 255, ${amount / this.maxPoints * 0.8})`;
        //     ctx.strokeStyle = "#fff2";
        //     ctx.fillRect(x * s, y * s, s, s);
        //     ctx.strokeRect(x * s, y * s, s, s);
        // }

        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "#aaa";
        ctx.beginPath();
        ctx.arc(this.size / 2, this.size / 2, this.size / 2, 0, 2 * Math.PI);
        ctx.stroke();
    }

    private constructGrids(): void {
        this.lastIndex = 0;
        this.arr = new Array(this.totalGridAmount + this.pointAmount);

        const subGrids = new Array(this.totalGridAmount);
        for (let i = 0; i < this.pointList.length; i++) {
            const point = this.pointList[i];
            const gridX = Math.floor(point.x / this.subGridSize);
            const gridY = Math.floor(point.y / this.subGridSize);
            const gridIDX = gridX + gridY * this.axisGridAmount;

            if (!subGrids[gridIDX]) subGrids[gridIDX] = [];
            subGrids[gridIDX].push(i);
        }

        for (let i = 0; i < this.totalGridAmount; i++) {
            if (!subGrids[i]) subGrids[i] = [];

            this.arr[this.lastIndex] = subGrids[i].length;
            for (let j = 0; j < subGrids[i].length; j++) {
                this.arr[this.lastIndex + j + 1] = subGrids[i][j];
            }

            this.lastIndex += subGrids[i].length + 1;
        }
    }
}
