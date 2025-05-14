import { NextResponse } from 'next/server';
// import puppeteer from 'puppeteer'; // No longer needed
// import { marked } from 'marked'; // No longer needed

export async function POST(request: Request) {
    // PDF Export is currently disabled.
    console.log("API route /api/export/pdf called, but PDF export is disabled.");
    return NextResponse.json(
        { error: 'PDF export is currently not available.', details: 'This feature has been temporarily disabled.' },
        { status: 501 } // 501 Not Implemented
    );
} 