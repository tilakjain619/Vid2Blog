import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Vid2Blog API is running',
    timestamp: new Date().toISOString(),
  });
}