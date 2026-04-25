type ArrayVector = [number, number, number];

interface Vector {
    /**
     * @param x X-axis
     * @param y Y-axis
     * @param z Z-axis
     */
    new(x?: number, y?: number, z?: number): Vector;

    /**
     * Overloaded +. Adds vectors together.
     */
    __add(b: Vector | ArrayVector): Vector;
    /**
     * Overloaded -. Subtracts vectors.
     */
    __sub(b: Vector | ArrayVector): Vector;
    /**
     * Overloaded * returns the vectors multiplied together. Can also be used to
     * multiply with scalars.
     */
    __mul(b: Vector | ArrayVector | number): Vector;
    /**
     * Overloaded /. Divides vectors.
     */
    __div(b: Vector | ArrayVector | number): Vector;
    /**
     * Overloaded ==. Tests for Equality.
     */
    __eq(b: Vector | ArrayVector): boolean;
    /**
     * Overloaded `Length` returns the length of the vector.
     */
    __len(): number;
    /**
     * Overloaded - operator. Reverses the vector.
     */
    __unm(): Vector;
    /**
     * Cross product of two vectors.
     */
    Cross(b: Vector | ArrayVector): Vector;
    /**
     * Dot product of two vectors.
     */
    Dot(b: Vector | ArrayVector): number;
    /**
     * Clamps a vector to a radius.
     */
    Clamp(b: Vector | ArrayVector, radius: number): Vector;
    /**
     * Overloaded `Length` returns the length of the vector.
     */
    length(): number;
    /**
     * Length of the Vector.
     */
    Length(): number;
    /**
     * Length of the Vector in the XY plane.
     */
    Length2D(): number;
    /**
     * Returns the vector normalized.
     */
    Normalized(): Vector;
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
    Lerp(b: Vector | ArrayVector, t: number): Vector;
    /**
     * Returns a string representation of a vector.
     */
    toString(): string;
    /**
     * Convert vector to 3-length array.
     */
    toArray(): ArrayVector;
}