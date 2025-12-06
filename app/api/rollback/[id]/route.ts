import { NextResponse } from 'next/server';
import { rollbackDeployment } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deploymentId = params.id;

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    await rollbackDeployment(deploymentId);

    return NextResponse.json({
      success: true,
      message: 'Rollback completed'
    });
  } catch (error: any) {
    console.error('Rollback error:', error);
    return NextResponse.json({
      error: 'Rollback failed',
      details: error.message
    }, { status: 500 });
  }
}
