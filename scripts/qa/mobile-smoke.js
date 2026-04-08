const path = require('path');
const { spawn } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '../..');
const mobileDir = path.join(workspaceRoot, 'mobile');

function run(command, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: mobileDir,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

async function main() {
  await run('npm run typecheck', 'Mobile typecheck');
  await run('npx expo config --type public', 'Expo config validation');
  process.stdout.write('Mobile smoke passed\n');
}

main().catch((error) => {
  process.stderr.write(`Mobile smoke failed: ${error.message}\n`);
  process.exit(1);
});
