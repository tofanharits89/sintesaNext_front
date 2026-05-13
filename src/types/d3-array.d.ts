declare module "d3-array" {
  export function bisector<T, U>(
    accessor: (datum: T) => U
  ): {
    left: (array: ArrayLike<T>, x: U, lo?: number, hi?: number) => number;
    right: (array: ArrayLike<T>, x: U, lo?: number, hi?: number) => number;
    center: (array: ArrayLike<T>, x: U, lo?: number, hi?: number) => number;
  };
  export function extent<T>(
    values: Iterable<T>,
    accessor?: (datum: T) => number | undefined | null
  ): [number, number] | [undefined, undefined];
}
