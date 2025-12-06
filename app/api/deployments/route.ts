import { NextResponse } from 'next/server';
import { getDeployments } from '@/lib/db';

export async function GET() {
  try {
    const deployments = await getDeployments();
    return NextResponse.json(deployments);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}
