// Ambient module declarations for pdfjs-dist UMD builds used via dynamic import
// These provide minimal types so TypeScript can resolve the module paths.

declare module 'pdfjs-dist/build/pdf.js' {
  const pdfjsLib: any
  export = pdfjsLib
}

declare module 'pdfjs-dist/legacy/build/pdf.js' {
  const pdfjsLib: any
  export = pdfjsLib
}

// Bare entry points that can resolve to .js or .mjs depending on package
declare module 'pdfjs-dist/build/pdf' {
  const pdfjsLib: any
  export default pdfjsLib
}

declare module 'pdfjs-dist/legacy/build/pdf' {
  const pdfjsLib: any
  export default pdfjsLib
}

declare module 'pdfjs-dist/build/pdf.mjs' {
  const pdfjsLib: any
  export default pdfjsLib
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  const pdfjsLib: any
  export default pdfjsLib
}

// Worker module import returns a string URL when bundled
declare module 'pdfjs-dist/build/pdf.worker.min.mjs' {
  const workerSrc: string
  export default workerSrc
}