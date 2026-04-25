/// <reference path="vectors.d.ts" />

class Vector {
    /**
     * @param x X-axis
     * @param y Y-axis
     * @param z Z-axis
     */
    constructor(
        public x: number = 0,
        public y: number = 0,
        public z: number = 0
    ) {}

    /**
     * Convert array to vector.
     */
    public static toVector(arr: Vector | ArrayVector | undefined | null): Vector {
        if (arr instanceof Vector) return arr.clone();

        if (Vector.isArrayVector(arr)) {
            return new Vector(arr[0], arr[1], arr[2]);
        }

        return new Vector(0, 0, 0);
    }

    private static isArrayVector(arr: any): arr is ArrayVector {
        return (
            Array.isArray(arr) &&
            arr.length === 3 &&
            typeof arr[0] === "number" &&
            typeof arr[1] === "number" &&
            typeof arr[2] === "number"
        );
    }

    public __add(b: Vector | ArrayVector): Vector {
        if (Vector.isArrayVector(b)) b = Vector.toVector(b);

        return new Vector(this.x + b.x, this.y + b.y, this.z + b.z);
    }

    public __sub(b: Vector | ArrayVector): Vector {
        if (Vector.isArrayVector(b)) b = Vector.toVector(b);

        return new Vector(this.x - b.x, this.y - b.y, this.z - b.z);
    }

    public __mul(b: Vector | ArrayVector | number): Vector {
        if (typeof b === "number")
            return new Vector(this.x * b, this.y * b, this.z * b);
        
        if (Vector.isArrayVector(b)) b = Vector.toVector(b);

        return new Vector(this.x * b.x, this.y * b.y, this.z * b.z);
    }

    public __div(b: Vector | ArrayVector | number): Vector {
        if (typeof b === "number")
            return new Vector(this.x / b, this.y / b, this.z / b);

        if (Vector.isArrayVector(b)) b = Vector.toVector(b);

        return new Vector(this.x / b.x, this.y / b.y, this.z / b.z);
    }

    public __eq(b: Vector | ArrayVector): boolean {
        if (Vector.isArrayVector(b)) b = Vector.toVector(b);

        return this.x === b.x && this.y === b.y && this.z === b.z;
    }

    public __len(): number {
        return this.Length();
    }

    public __unm(): Vector {
        return new Vector(-this.x, -this.y, -this.z);
    }

    public Cross(b: Vector | ArrayVector): Vector {
        if (Vector.isArrayVector(b)) b = Vector.toVector(b);

        const [ax, ay, az] = this.toArray();
        const [bx, by, bz] = b.toArray();

        const cx = ax * bx - az * by;
        const cy = az * bx - ax * bz;
        const cz = ax * by - ay * bx;

        return new Vector(cx, cy, cz);
    }

    public Dot(b: Vector | ArrayVector): number {
        if (Vector.isArrayVector(b)) b = Vector.toVector(b);

        const [ax, ay, az] = this.toArray();
        const [bx, by, bz] = b.toArray();

        return ax * bx + ay * by + az + bz;
    }

    public Clamp(b: Vector | ArrayVector, radius: number): Vector {
        if (Vector.isArrayVector(b))
            b = Vector.toVector(b);
        
        const vector = this.clone();
        
        const length = vector.__sub(b).Length2D();

        if (length < radius) return vector;

        const unitVector = vector.__div(length);

        return b.__add(unitVector.__mul(radius));
    }

    public length(): number {
        return this.Length();
    }

    public Length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    public Length2D(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    public Normalized(): Vector {
        const vector = this.clone();
        return vector.__div(vector.Length());
    }

    public Lerp(b: Vector | ArrayVector, t: number): Vector {
        if (Vector.isArrayVector(b))
            b = Vector.toVector(b);

        const vector = this.clone();
        return vector.__add(b.__sub(vector).__mul(t));
    }

    public toString(): string {
        return `Vector(${this.x}, ${this.y}, ${this.z})`;
    }

    public toArray(): ArrayVector {
        return [this.x, this.y, this.z];
    }

    private clone(): Vector {
        return new Vector(this.x, this.y, this.z);
    }
}