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

declare module 'pdfjs-dist/webpack' {
  export * from 'pdfjs-dist/build/pdf.mjs'
}

declare module 'pdfjs-dist/build/pdf.mjs' {
  export * from 'pdfjs-dist'
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export * from 'pdfjs-dist'
}