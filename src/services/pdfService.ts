import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import mammoth from 'mammoth';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';
// @ts-ignore - Vite specific import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set up PDF.js worker using Vite's asset bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const pdfService = {
  /**
   * Merge multiple PDF files into one.
   */
  async mergePdfs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save();
  },

  /**
   * Convert images (JPG/PNG) to a single PDF.
   */
  async imagesToPdf(files: File[]): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      let image;
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        image = await pdfDoc.embedJpg(arrayBuffer);
      } else if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else {
        continue;
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }
    return await pdfDoc.save();
  },

  /**
   * Add a text watermark to a PDF.
   */
  async addWatermark(file: File, text: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(text, {
        x: width / 4,
        y: height / 2,
        size: 50,
        font: font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.3,
        rotate: { type: 'degrees', angle: 45 } as any,
      });
    }
    return await pdfDoc.save();
  },

  /**
   * Convert PDF to Word (Improved text extraction with line grouping).
   */
  async pdfToWord(file: File): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const paragraphs: Paragraph[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Group items by their Y coordinate (transform[5])
      const items = textContent.items as any[];
      const lines: { [key: number]: any[] } = {};
      
      items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push(item);
      });

      // Sort lines by Y coordinate (top to bottom)
      const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
      
      sortedY.forEach(y => {
        // Sort items in line by X coordinate
        const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = lineItems.map(item => item.str).join(' ');
        
        if (lineText.trim()) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun(lineText)],
              spacing: { before: 100, after: 100 }
            })
          );
        }
      });

      // Add a page break after each PDF page except the last one
      if (i < pdf.numPages) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));
      }
    }

    const doc = new Document({
      sections: [{
        children: paragraphs,
      }],
    });

    return await Packer.toBlob(doc);
  },

  /**
   * Convert PowerPoint to PDF (Basic text extraction per slide).
   */
  async pptToPdf(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineHeight = 7;

    // Get all slide files
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)![0]);
        const numB = parseInt(b.match(/\d+/)![0]);
        return numA - numB;
      });

    for (let i = 0; i < slideFiles.length; i++) {
      if (i > 0) doc.addPage();
      
      const slideXml = await zip.file(slideFiles[i])!.async('string');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(slideXml, 'application/xml');
      
      // Extract all text from <a:t> tags
      const textNodes = xmlDoc.getElementsByTagName('a:t');
      let slideText = `Slide ${i + 1}\n\n`;
      
      for (let j = 0; j < textNodes.length; j++) {
        slideText += textNodes[j].textContent + " ";
      }

      const lines = doc.splitTextToSize(slideText, maxWidth);
      let cursorY = margin;

      lines.forEach((line: string) => {
        if (cursorY + lineHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });
    }

    return new Uint8Array(doc.output('arraybuffer'));
  },

  /**
   * Convert Word to PDF (Improved text extraction and wrapping).
   */
  async wordToPdf(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const margin = 50;
    const lineHeight = 14;

    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();
    let currentY = height - margin;
    const maxWidth = width - (margin * 2);

    const paragraphs = text.split('\n');
    
    for (const para of paragraphs) {
      if (!para.trim()) {
        currentY -= lineHeight;
        continue;
      }

      // Simple word wrap
      const words = para.split(' ');
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth) {
          page.drawText(currentLine, {
            x: margin,
            y: currentY,
            size: fontSize,
            font: font,
          });
          currentY -= lineHeight;
          currentLine = word;

          if (currentY < margin) {
            page = pdfDoc.addPage();
            currentY = height - margin;
          }
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: font,
        });
        currentY -= lineHeight;
      }

      // Add extra space between paragraphs
      currentY -= 5;
      if (currentY < margin) {
        page = pdfDoc.addPage();
        currentY = height - margin;
      }
    }

    return await pdfDoc.save();
  },

  /**
   * Convert plain text to PDF.
   */
  async textToPdf(text: string): Promise<Uint8Array> {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);
    
    // Split text into lines that fit the page width
    const lines = doc.splitTextToSize(text, maxWidth);
    
    let cursorY = margin;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineHeight = 7;

    lines.forEach((line: string) => {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });

    return new Uint8Array(doc.output('arraybuffer'));
  },

  /**
   * Convert plain text to Word.
   */
  async textToWord(text: string): Promise<Blob> {
    const paragraphs = text.split('\n').map(line => 
      new Paragraph({
        children: [new TextRun(line)],
        spacing: { before: 100, after: 100 }
      })
    );

    const doc = new Document({
      sections: [{
        children: paragraphs,
      }],
    });

    return await Packer.toBlob(doc);
  },

  /**
   * Extract text from a PDF file.
   */
  async extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];
      
      // Group items by their Y coordinate
      const lines: { [key: number]: any[] } = {};
      items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push(item);
      });

      const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
      sortedY.forEach(y => {
        const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
        fullText += `[Page ${i}] ` + lineItems.map(item => item.str).join(' ') + "\n";
      });
    }
    return fullText;
  },

  /**
   * Analyze PDF content using Gemini AI.
   */
  async analyzePdfWithAi(file: File, prompt: string): Promise<string> {
    const text = await this.extractTextFromPdf(file);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `You are JARVIS, a highly advanced AI assistant. Analyze the following PDF content and answer the user's request.\n\nPDF CONTENT:\n${text}\n\nUSER REQUEST: ${prompt}` }]
        }
      ],
      config: {
        systemInstruction: "You are JARVIS, a helpful and intelligent AI assistant. Your task is to analyze PDF content. You can summarize, explain specific pages, extract key points, and translate text. Provide clear, concise, and professional responses based strictly on the provided PDF content. CRITICAL: DO NOT include any introductory or concluding remarks (e.g., 'Hello, I am JARVIS', 'Here is a summary', 'Please let me know if you need anything else'). Output ONLY the core requested information without any conversational filler."
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  }
};
