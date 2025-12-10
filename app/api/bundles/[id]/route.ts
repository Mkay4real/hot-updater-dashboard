import { NextResponse } from 'next/server';
import { updateBundle, deleteBundle } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = params.id;
    const body = await request.json();

    await updateBundle(bundleId, {
      message: body.message,
      enabled: body.enabled,
      forceUpdate: body.forceUpdate
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update bundle error:', error);
    return NextResponse.json(
      { error: 'Failed to update bundle', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = params.id;
    await deleteBundle(bundleId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete bundle error:', error);
    return NextResponse.json(
      { error: 'Failed to delete bundle', details: error.message },
      { status: 500 }
    );
  }
}
