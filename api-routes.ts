// api/deployments/route.ts
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

// api/bundles/route.ts
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

// api/stats/route.ts
import { NextResponse } from 'next/server';
import { getStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

// api/deploy/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const { platform, channel } = await request.json();

    // Execute hot-updater deploy command
    const command = `npx hot-updater deploy -p ${platform} -c ${channel}`;
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Deployment stderr:', stderr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Deployment completed',
      output: stdout 
    });
  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json({ 
      error: 'Deployment failed', 
      details: error.message 
    }, { status: 500 });
  }
}

// api/rollback/[id]/route.ts
import { NextResponse } from 'next/server';
import { rollbackDeployment } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deploymentId = params.id;
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
