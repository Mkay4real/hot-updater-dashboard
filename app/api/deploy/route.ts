import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const { platform, channel, branch, appVersion, forceUpdate, message } = await request.json();

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
    let output = '';

    // Optionally checkout branch before deploying
    const branchPrefix = branch ? `git checkout ${branch} && ` : '';

    // Build deployment flags
    // Note: Strategy is configured in hot-updater.config.ts, not via CLI
    let deployFlags = '';
    if (appVersion) {
      // Use -t flag for target app version (supports semver: 1.0.0, 1.x.x, >=1.0.0)
      deployFlags += `-t "${appVersion}"`;
    }
    if (forceUpdate) {
      deployFlags += ' --force-update';
    }
    if (message) {
      deployFlags += ` -m "${message}"`;
    }

    if (platform === 'all') {
      // Deploy to both platforms sequentially
      const iosCommand = `cd ${projectPath} && ${branchPrefix}npx hot-updater deploy -p ios -c ${channel} ${deployFlags}`;
      const androidCommand = `cd ${projectPath} && ${branchPrefix}npx hot-updater deploy -p android -c ${channel} ${deployFlags}`;

      console.log('[DEPLOY] Executing iOS command:', iosCommand);

      // Deploy to iOS first
      const iosResult = await execPromise(iosCommand, {
        timeout: 300000, // 5 minute timeout
      });

      if (iosResult.stderr && !iosResult.stderr.includes('warning')) {
        console.error('iOS deployment stderr:', iosResult.stderr);
      }

      output += `iOS Deployment:\n${iosResult.stdout}\n\n`;

      console.log('[DEPLOY] Executing Android command:', androidCommand);

      // Then deploy to Android
      const androidResult = await execPromise(androidCommand, {
        timeout: 300000, // 5 minute timeout
      });

      if (androidResult.stderr && !androidResult.stderr.includes('warning')) {
        console.error('Android deployment stderr:', androidResult.stderr);
      }

      output += `Android Deployment:\n${androidResult.stdout}`;
    } else {
      // Deploy to single platform
      const command = `cd ${projectPath} && ${branchPrefix}npx hot-updater deploy -p ${platform} -c ${channel} ${deployFlags}`;

      console.log('[DEPLOY] Executing command:', command);

      const { stdout, stderr } = await execPromise(command, {
        timeout: 300000, // 5 minute timeout
      });

      if (stderr && !stderr.includes('warning')) {
        console.error('Deployment stderr:', stderr);
      }

      output = stdout;
    }

    return NextResponse.json({
      success: true,
      message: 'Deployment completed',
      output
    });
  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json({
      error: 'Deployment failed',
      details: error.message
    }, { status: 500 });
  }
}
