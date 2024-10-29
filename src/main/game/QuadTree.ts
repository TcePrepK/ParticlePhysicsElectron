import { getElementById } from "../core/HTMLUtils";

export class QuadTree {
    private width = 600;
    private height = 600;

    private pointAmount = 0;
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
        const totalTimeTook = 0;
        const totalChecks = 0;
        const sampleAmount = 1;
        for (let sample = 0; sample < sampleAmount; sample++) {
            this.lastIndex = 0;
            this.arr = new Array(256 * 1024).fill(1);
            this.pointList = [];

            for (let i = 0; i < this.pointAmount; i++) {
                const a = Math.random() * 2 * Math.PI;
                const x = this.width / 2 + Math.cos(a) * (this.width / 2 - 50);
                const y = this.height / 2 + Math.sin(a) * (this.height / 2 - 50);
                this.pointList.push({ x: x, y: y, px: x, py: y, r: 5 });
            }
        }

        console.log("Point Amount: " + this.pointAmount);
        console.log("Average Checks: " + totalChecks / sampleAmount);
        console.log("Average Time Took: " + totalTimeTook / sampleAmount + "ms");

        const canvas = getElementById("record-canvas") as HTMLCanvasElement;
        canvas.width = this.width;
        canvas.height = this.height;

        canvas.addEventListener("click", (event) => {
            const x = event.clientX - canvas.offsetLeft;
            const y = event.clientY - canvas.offsetTop;

            this.pointList.push({ x: x, y: y, px: x, py: y, r: 2 });
            this.pointAmount++;
        });

        this.ctx = canvas.getContext("2d")!;
    }

    private handlePhysics(dt: number): void {
        const accX = 0;
        const accY = 1000;

        for (const point of this.pointList) {
            const nextX = point.x + (point.x - point.px) + accX * dt * dt;
            const nextY = point.y + (point.y - point.py) + accY * dt * dt;

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

    private handleCollision(): void {
        this.constructTree();
        // for (let pointIDX = 0; pointIDX < this.pointList.length; pointIDX++) {
        //     this.addPointToTree(pointIDX);
        // }

        for (let pointIDX = 0; pointIDX < this.pointList.length; pointIDX++) {
            this.addPointToTree(pointIDX);

            const pointA = this.pointList[pointIDX];
            const collisionRoot = this.getRootByCoords(pointA.x, pointA.y);
            for (let i = 0; i < 4; i++) {
                const collisionPointIDX = this.arr[collisionRoot + i];
                if (collisionPointIDX > 0) continue;
                if (collisionPointIDX === pointIDX) continue;

                const pointB = this.pointList[-collisionPointIDX];
                if (pointB === pointA) continue;

                const dx = pointA.x - pointB.x;
                const dy = pointA.y - pointB.y;
                const tr = pointA.r + pointB.r;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > tr) continue;

                const massRatioA = pointA.r / tr;
                const massRatioB = pointB.r / tr;

                const delta = 0.5 * 1 * (tr - dist);

                pointA.x += dx / dist * delta * massRatioA;
                pointA.y += dy / dist * delta * massRatioA;
                pointB.x -= dx / dist * delta * massRatioB;
                pointB.y -= dy / dist * delta * massRatioB;
            }
        }
    }

    private handleConstrains(): void {
        for (const point of this.pointList) {
            const centerX = this.width / 2;
            const centerY = this.height / 2;

            const dx = point.x - centerX;
            const dy = point.y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.width / 2 - point.r) {
                point.x = centerX + dx / dist * (this.width / 2 - point.r);
                point.y = centerY + dy / dist * (this.width / 2 - point.r);
            }
        }
    }

    public update(): void {
        if (this.pointAmount !== 1000) {
            const x = this.width / 4;
            const y = this.height / 4 * 1;
            this.pointList.push({ x: x, y: y + 4.5, px: x, py: y, r: Math.random() * 4 + 5 });
            this.pointAmount++;
        }

        const subSteps = 8;
        for (let i = 0; i < subSteps; i++) {
            this.handleCollision();
            this.handleConstrains();
            this.handlePhysics((1 / 60) / subSteps);
        }

        this.renderQuad();
        // this.renderBranches(0, 0, this.width, 0, this.height);
    }

    private getRootByCoords(x: number, y: number): number {
        let curLeft = 0;
        let curRight = this.width;
        let curTop = 0;
        let curBottom = this.height;
        let root = 0;

        while (root < this.arr.length) {
            const idx = this.getIDX(x, y, curLeft, curRight, curTop, curBottom);
            if (this.arr[root + idx] > 1) {
                const w = curRight - curLeft;
                const h = curBottom - curTop;
                const idxX = idx & 1;
                const idxY = idx >> 1;

                curLeft += (idxX * w) / 2;
                curRight -= ((1 - idxX) * w) / 2;
                curTop += (idxY * h) / 2;
                curBottom -= ((1 - idxY) * h) / 2;
                root = this.arr[root + idx];

                continue;
            }

            return root;
        }

        throw new Error("Array is too small!");
    }

    private renderQuad(): void {
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.pointList.length; i++) {
            // const point = this.pointList[i];
            // this.ctx.fillStyle = "#f00";
            // this.ctx.fillRect(point.x, point.y, point.r, point.r);

            const point = this.pointList[i];

            this.ctx.fillStyle = "#0f0";
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, point.r, 0, 2 * Math.PI);
            this.ctx.fill();
        }

        this.ctx.lineWidth = 0.5;
        this.ctx.strokeStyle = "#aaa";
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    private renderBranches(root: number, left: number, right: number, top: number, bottom: number): void {
        if (root === 1) return;

        const ctx = this.ctx;

        ctx.lineWidth = 0.1;
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.closePath();
        ctx.stroke();

        if (this.arr[root] <= 0) {
            let points = 0;
            for (let i = 0; i < 4; i++) {
                if (this.arr[root + i] > 0) continue;
                points++;

                const idx = this.arr[root + i];
                const point = this.pointList[-idx];

                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                for (let j = 0; j < 4; j++) {
                    const subIDX = this.arr[root + j];
                    if (subIDX === idx) continue;
                    if (subIDX > 0) continue;
                    const point = this.pointList[-subIDX];
                    ctx.lineTo(point.x, point.y);
                }
                ctx.stroke();

                // const point = this.pointList[-this.arr[root + i]];
                //
                // ctx.fillStyle = "#0f0";
                // ctx.beginPath();
                // ctx.arc(point.x, point.y, point.r, 0, 2 * Math.PI);
                // ctx.fill();
            }

            ctx.fillStyle = `rgba(255, 255, 255, ${points / 4 * 0.2})`;
            ctx.fillRect(left, top, right - left, bottom - top);
        }

        for (let i = 0; i < 4; i++) {
            if (this.arr[root + i] <= 0) continue;

            const idxX = i & 1;
            const idxY = i >> 1;

            const width = right - left;
            const height = bottom - top;
            const newLeft = left + (idxX * width) / 2;
            const newRight = right - ((1 - idxX) * width) / 2;
            const newTop = top + (idxY * height) / 2;
            const newBottom = bottom - ((1 - idxY) * height) / 2;

            this.renderBranches(this.arr[root + i], newLeft, newRight, newTop, newBottom);
        }
    }

    getIDX(x: number, y: number, left: number, right: number, top: number, bottom: number): number {
        const dx = x - left;
        const dy = y - top;
        const w = right - left;
        const h = bottom - top;

        return (dx < w / 2 ? 0 : 1) + 2 * (dy < h / 2 ? 0 : 1);
    }

    findFirstEmpty(root: number): number {
        if (this.arr[root] > 1) return -1;
        if (this.arr[root] === 1) return root;
        if (this.arr[root + 1] === 1) return root + 1;
        if (this.arr[root + 2] === 1) return root + 2;
        if (this.arr[root + 3] === 1) return root + 3;
        return -1;
    }

    createBranch(root: number): number[] {
        const prevPoints = [0, 1, 2, 3].map((i) => this.arr[root + i]);

        for (let i = 0; i < 4; i++) {
            this.arr[root + i] = this.lastIndex += 4;
        }
        this.lastIndex += 4;

        return prevPoints;

        ///////////////////////////////

        // const point1 = -arr[root];
        // const point2 = -arr[root + 1];
        // const point3 = -arr[root + 2];
        // const point4 = -arr[root + 3];

        // arr[root] = lastIndex += 4;
        // arr[root + 1] = lastIndex += 4;
        // arr[root + 2] = lastIndex += 4;
        // arr[root + 3] = lastIndex += 4;
        // lastIndex += 4;

        // const idx1 = getIDX(point1, curLeft, curRight, curTop, curBottom);
        // const idx2 = getIDX(point2, curLeft, curRight, curTop, curBottom);
        // const idx3 = getIDX(point3, curLeft, curRight, curTop, curBottom);
        // const idx4 = getIDX(point4, curLeft, curRight, curTop, curBottom);

        // arr[findFirstEmpty(arr[root + idx1])] = -point1;
        // arr[findFirstEmpty(arr[root + idx2])] = -point2;
        // arr[findFirstEmpty(arr[root + idx3])] = -point3;
        // arr[findFirstEmpty(arr[root + idx4])] = -point4;
    }

    // returns [dleft, dtop, dright, dbottom]
    addPoint(x: number, y: number, pointIDX: number): number[] {
        const mainPoint = this.pointList[pointIDX];
        let curLeft = 0;
        let curRight = this.width;
        let curTop = 0;
        let curBottom = this.height;
        let root = 0;

        while (root < this.arr.length) {
            const empty = this.findFirstEmpty(root);
            if (empty >= 0) {
                this.arr[empty] = -pointIDX;
                return [
                    x - mainPoint.r - curLeft, // dleft
                    y - mainPoint.r - curTop, // dtop
                    curRight - x - mainPoint.r, // dright
                    curBottom - y - mainPoint.r // dbottom
                ];
            }

            const idx = this.getIDX(x, y, curLeft, curRight, curTop, curBottom);
            if (this.arr[root + idx] > 1) {
                const w = curRight - curLeft;
                const h = curBottom - curTop;
                const idxX = idx & 1;
                const idxY = idx >> 1;

                curLeft += (idxX * w) / 2;
                curRight -= ((1 - idxX) * w) / 2;
                curTop += (idxY * h) / 2;
                curBottom -= ((1 - idxY) * h) / 2;
                root = this.arr[root + idx];

                continue;
            }

            const prevPoints = this.createBranch(root);
            prevPoints.push(-pointIDX);
            for (const prevPoint of prevPoints) {
                const leftOverPoint = this.pointList[-prevPoint];

                const xmid = curLeft + (curRight - curLeft) / 2;
                const ymid = curTop + (curBottom - curTop) / 2;

                const dleft = (leftOverPoint.x - leftOverPoint.r) < xmid;
                const dtop = (leftOverPoint.y - leftOverPoint.r) < ymid;
                const dright = (leftOverPoint.x + leftOverPoint.r) > xmid;
                const dbottom = (leftOverPoint.y + leftOverPoint.r) > ymid;

                if (dleft && dtop) {
                    this.arr[this.findFirstEmpty(this.arr[root])] = prevPoint;
                }
                if (dright && dtop) {
                    this.arr[this.findFirstEmpty(this.arr[root + 1])] = prevPoint;
                }
                if (dleft && dbottom) {
                    this.arr[this.findFirstEmpty(this.arr[root + 2])] = prevPoint;
                }
                if (dright && dbottom) {
                    this.arr[this.findFirstEmpty(this.arr[root + 3])] = prevPoint;
                }
            }

            return [
                x - mainPoint.r - curLeft,
                y - mainPoint.r - curTop,
                curRight - x - mainPoint.r,
                curBottom - y - mainPoint.r
            ];
        }

        throw new Error("Array is too small!");
    }

    private addPointToTree(pointIDX: number): void {
        const point = this.pointList[pointIDX];
        const [dleft, dtop, dright, dbottom] = this.addPoint(point.x, point.y, pointIDX);
        if (dleft < 0) {
            this.addPoint(point.x - point.r, point.y, pointIDX);

            if (dtop < 0) {
                this.addPoint(point.x - point.r, point.y - point.r, pointIDX);
            }
            if (dbottom < 0) {
                this.addPoint(point.x - point.r, point.y + point.r, pointIDX);
            }
        }
        if (dright < 0) {
            this.addPoint(point.x + point.r, point.y, pointIDX);

            if (dtop < 0) {
                this.addPoint(point.x + point.r, point.y - point.r, pointIDX);
            }
            if (dbottom < 0) {
                this.addPoint(point.x + point.r, point.y + point.r, pointIDX);
            }
        }
        if (dtop < 0) {
            this.addPoint(point.x, point.y - point.r, pointIDX);
        }
        if (dbottom < 0) {
            this.addPoint(point.x, point.y + point.r, pointIDX);
        }
    }

    private constructTree(): void {
        this.lastIndex = 0;
        this.arr = new Array(16 * 1024).fill(1);

        // for (let i = 0; i < this.pointList.length; i++) this.addPointToTree(i);
    }
}
