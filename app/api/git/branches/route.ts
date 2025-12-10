import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET() {
  try {
    const projectPath = process.env.HOT_UPDATER_PROJECT_PATH;

    if (!projectPath) {
      return NextResponse.json(
        { error: 'HOT_UPDATER_PROJECT_PATH environment variable is not set' },
        { status: 500 }
      );
    }

    // Get all branches
    const { stdout: branchOutput } = await execPromise(
      `cd ${projectPath} && git branch -a --format='%(refname:short)'`
    );

    // Get current branch
    const { stdout: currentBranch } = await execPromise(
      `cd ${projectPath} && git rev-parse --abbrev-ref HEAD`
    );

    const branches = branchOutput
      .split('\n')
      .map(b => b.trim())
      .filter(b => b && !b.includes('HEAD'))
      .filter(b => !b.startsWith('remotes/'))
      .sort();

    return NextResponse.json({
      branches,
      current: currentBranch.trim()
    });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({
      branches: [],
      current: '',
      error: error.message
    });
  }
}
