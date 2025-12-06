import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const { platform, channel } = await request.json();

    // Validate inputs
    if (!platform || !channel) {
      return NextResponse.json(
        { error: 'Platform and channel are required' },
        { status: 400 }
      );
    }

    if (!['ios', 'android', 'all'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be ios, android, or all' },
        { status: 400 }
      );
    }

    // Get the Hot Updater project path from environment
    const projectPath = process.env.HOT_UPDATER_PROJECT_PATH;

    if (!projectPath) {
      return NextResponse.json(
        { error: 'HOT_UPDATER_PROJECT_PATH environment variable is not set' },
        { status: 500 }
      );
    }

    // Execute hot-updater deploy command
    const command = `cd ${projectPath} && npx hot-updater deploy -p ${platform} -c ${channel}`;
    const { stdout, stderr } = await execPromise(command, {
      timeout: 300000, // 5 minute timeout
    });

    if (stderr && !stderr.includes('warning')) {
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
