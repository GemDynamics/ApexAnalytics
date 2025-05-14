import { NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx';
import { marked } from 'marked';

export async function POST(request: Request) {
  try {
    const { markdownContent, fileName } = await request.json();

    if (!markdownContent) {
      return NextResponse.json({ error: 'Missing markdownContent for changelog in request body' }, { status: 400 });
    }

    // Convert Markdown to HTML using marked
    const htmlContent = marked.parse(markdownContent);

    console.log("API route /api/export/changelog-docx called");
    
    const fileBuffer = await HTMLtoDOCX(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      header: true,
    });

    // Construct the filename for the download
    const exportFileName = fileName ? `${fileName}.docx` : 'changelog.docx';//fileName already includes _Changelog

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${exportFileName}"`,
        },
    });

  } catch (error) {
    console.error("Error in Changelog DOCX export API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate Changelog DOCX file', details: errorMessage }, { status: 500 });
  }
} 