import { NextResponse } from 'next/server';
import { getBundles } from '@/lib/db';

export async function GET() {
  try {
    const bundles = await getBundles();
    return NextResponse.json(bundles);
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
  }
}
