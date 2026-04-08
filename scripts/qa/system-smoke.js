const path = require('path');
const { spawn } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '../..');

function runNodeScript(scriptName, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, scriptName)], {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env: process.env,
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
  await runNodeScript('backend-smoke.js', 'Backend smoke');
  await runNodeScript('mobile-smoke.js', 'Mobile smoke');
  process.stdout.write('System smoke passed\n');
}

main().catch((error) => {
  process.stderr.write(`System smoke failed: ${error.message}\n`);
  process.exit(1);
});
