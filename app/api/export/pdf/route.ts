import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

export async function POST(request: Request) {
    let browser = null; // Declare browser outside try block
    try {
        // Receive Markdown content and filename from the request body
        const { markdownContent, fileName } = await request.json();

        if (!markdownContent) {
            return NextResponse.json({ error: 'Missing markdownContent in request body' }, { status: 400 });
        }

        // Convert Markdown to HTML using marked
        const htmlContent = marked.parse(markdownContent);

        // Basic HTML structure for PDF generation
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${fileName || 'Contract'}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; padding: 20px; }
                    h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
                    p { margin-bottom: 1em; }
                    ul, ol { margin-left: 1.5em; margin-bottom: 1em; }
                    /* Add more styles as needed */
                </style>
            </head>
            <body>${htmlContent}</body>
            </html>
        `;

        console.log("API route /api/export/pdf called");

        // Launch Puppeteer
        browser = await puppeteer.launch({
             headless: true, // Run in background
             args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necessary for some environments
        });
        const page = await browser.newPage();

        // Set content and generate PDF
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        const exportFileName = fileName ? `${fileName.replace(/\.[^/.]+$/, "")}.pdf` : 'contract.pdf';

        // Return the buffer with correct headers
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${exportFileName}"`,
            },
        });

    } catch (error) {
        console.error("Error in PDF export API:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to generate PDF file', details: errorMessage }, { status: 500 });
    } finally {
        if (browser) {
            await browser.close(); // Ensure browser is closed
        }
    }
} 