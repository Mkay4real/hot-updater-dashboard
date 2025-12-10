import { NextResponse } from 'next/server';
import { promoteBundle } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { bundleId, targetChannel, move } = await request.json();

    if (!bundleId || !targetChannel) {
      return NextResponse.json(
        { error: 'Bundle ID and target channel are required' },
        { status: 400 }
      );
    }

    await promoteBundle(bundleId, targetChannel, move || false);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Promote bundle error:', error);
    return NextResponse.json(
      { error: 'Failed to promote bundle', details: error.message },
      { status: 500 }
    );
  }
}
