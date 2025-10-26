type ArrayVector = [number, number, number];

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
     * Overloaded +. Adds vectors together.
     */
    public __add(b: Vector | ArrayVector): Vector {
        if (this.isArrayVector(b)) b = Vector.toVector(b);

        return new Vector(this.x + b.x, this.y + b.y, this.z + b.z);
    }

    /**
     * Overloaded -. Subtracts vectors.
     */
    public __sub(b: Vector | ArrayVector): Vector {
        if (this.isArrayVector(b)) b = Vector.toVector(b);

        return new Vector(this.x - b.x, this.y - b.y, this.z - b.z);
    }

    /**
     * Overloaded * returns the vectors multiplied together. Can also be used to
     * multiply with scalars.
     *
     * @both
     */
    public __mul(b: Vector | ArrayVector | number): Vector {
        if (typeof b === "number")
            return new Vector(this.x * b, this.y * b, this.z * b);
        
        if (this.isArrayVector(b)) b = Vector.toVector(b);

        return new Vector(this.x * b.x, this.y * b.y, this.z * b.z);
    }

    /**
     * Overloaded /. Divides vectors.
     */
    public __div(b: Vector | ArrayVector | number): Vector {
        if (typeof b === "number")
            return new Vector(this.x / b, this.y / b, this.z / b);

        if (this.isArrayVector(b)) b = Vector.toVector(b);

        return new Vector(this.x / b.x, this.y / b.y, this.z / b.z);
    }

    /**
     * Overloaded ==. Tests for Equality.
     */
    public __eq(b: Vector | ArrayVector): boolean {
        if (this.isArrayVector(b)) b = Vector.toVector(b);

        return (this.x === b.x && this.y === b.y && this.z === b.z);
    }

    /**
     * Overloaded `Length` returns the length of the vector.
     */
    public __len(): number {
        return this.Length();
    }

    /**
     * Overloaded - operator. Reverses the vector.
     */
    public __unm(): Vector {
        return new Vector(-this.x, -this.y, -this.z);
    }

    /**
     * Cross product of two vectors.
     */
    public Cross(b: Vector | ArrayVector): Vector {
        if (this.isArrayVector(b)) b = Vector.toVector(b);

        const [ax, ay, az] = this.toArray();
        const [bx, by, bz] = b.toArray();

        const cx = ax * bx - az * by;
        const cy = az * bx - ax * bz;
        const cz = ax * by - ay * bx;

        return new Vector(cx, cy, cz);
    }

    /**
     * Dot product of two vectors.
     */
    public Dot(b: Vector | ArrayVector): number {
        if (this.isArrayVector(b)) b = Vector.toVector(b);

        const [ax, ay, az] = this.toArray();
        const [bx, by, bz] = b.toArray();

        return ax * bx + ay * by + az + bz;
    }

    /**
     * Overloaded `Length` returns the length of the vector.
     */
    public length(): number {
        return this.Length();
    }

    /**
     * Length of the Vector.
     */
    public Length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    /**
     * Length of the Vector in the XY plane.
     */
    public Length2D(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    /**
     * Returns the vector normalized.
     */
    public Normalized(): Vector {
        const vector = this.clone();
        return vector.__div(vector.Length());
    }

    /**
     * Linearly interpolates between two vectors.
     *
     * This is most commonly used to find a point some fraction of the way along a
     * line between two endpoints.
     *
     * Same as `this + (b - this) * t`.
     *
     * @param t Interpolant
     */
    public Lerp(b: Vector | ArrayVector, t: number): Vector {
        if (this.isArrayVector(b))
            b = Vector.toVector(b);

        const vector = this.clone();
        return vector.__add(b.__sub(vector).__mul(t));
    }

    /**
     * Returns a string representation of a vector.
     */
    public toString(): string {
        return `Vector(${this.x}, ${this.y}, ${this.z})`;
    }

    /**
     * Convert vector to 3-length array.
     */
    public toArray(): ArrayVector {
        return [this.x, this.y, this.z];
    }

    /**
     * Convert array to vector.
     */
    public static toVector(arr: Vector | ArrayVector | undefined | null): Vector {
        if (arr instanceof Vector) return arr.clone();

        arr = arr ?? [0, 0, 0];
        return new Vector(arr[0], arr[1], arr[2]);
    }

    /**
     * Clamps a vector to a radius.
     */
    public Clamp(b: Vector | ArrayVector, radius: number): Vector {
        if (this.isArrayVector(b))
            b = Vector.toVector(b);
        
        const vector = this.clone();
        
        const length = vector.__sub(b).Length2D();

        if (length < radius) return vector;

        const unitVector = vector.__div(length);

        return b.__add(unitVector.__mul(radius));
    }

    private clone(): Vector {
        return new Vector(this.x, this.y, this.z);
    }

    private isArrayVector(arr: any): arr is ArrayVector {
        return (Array.isArray(arr)
            && arr.length === 3
            && typeof arr[0] === "number"
            && typeof arr[1] === "number"
            && typeof arr[2] === "number");
    }
}