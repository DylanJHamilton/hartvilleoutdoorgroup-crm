import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private platformId = inject(PLATFORM_ID);

  async open(docDefinition: any) {
    if (!isPlatformBrowser(this.platformId)) return; // no-op on server/prerender

    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

    const pdfMake: any = (pdfMakeModule as any).default ?? pdfMakeModule;
    const fonts: any = (pdfFontsModule as any).default ?? pdfFontsModule;

    // vfs is exposed either on fonts.vfs or fonts.pdfMake.vfs depending on build
    pdfMake.vfs = fonts.pdfMake?.vfs ?? fonts.vfs;

    pdfMake.createPdf(docDefinition).open(); // or .download(), .print()
  }
}
