export {};

declare global {
  interface Window {
    google: any;
  }
  // provide value position for `google`
  var google: any;
}
