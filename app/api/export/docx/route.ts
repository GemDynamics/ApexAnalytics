import { NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx'; // Import the library
import { marked } from 'marked'; // Import marked for Markdown to HTML

export async function POST(request: Request) {
  try {
    // Receive Markdown content from the request body
    const { markdownContent, fileName } = await request.json();

    if (!markdownContent) {
      return NextResponse.json({ error: 'Missing markdownContent in request body' }, { status: 400 });
    }

    // Convert Markdown to HTML using marked
    const htmlContent = marked.parse(markdownContent);

    console.log("API route /api/export/docx called");
    
    // Generate DOCX buffer
    const fileBuffer = await HTMLtoDOCX(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footer: true, // Enable footer for potential page numbers
      header: true, // Enable header
      // Consider adding pageNumber option if needed
    });

    const exportFileName = fileName ? `${fileName.replace(/\.[^/.]+$/, "")}.docx` : 'contract.docx';

    // Return the buffer with correct headers
    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${exportFileName}"`,
        },
    });

  } catch (error) {
    console.error("Error in DOCX export API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate DOCX file', details: errorMessage }, { status: 500 });
  }
} 