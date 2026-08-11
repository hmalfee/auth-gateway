#!/usr/bin/env node
import { $, chalk, echo, fs, spinner } from 'zx';

$.verbose = false;

const NEXT_DIR = '.next';
const STANDALONE_DIR = `${NEXT_DIR}/standalone`;
const TARGET_NEXT_DIR = `${STANDALONE_DIR}/.next`;
const TARGET_STATIC_DIR = `${TARGET_NEXT_DIR}/static`;
const TARGET_PUBLIC_DIR = `${STANDALONE_DIR}/public`;

if (!(await fs.pathExists(STANDALONE_DIR))) {
    echo(
        chalk.red(
            `[ERROR] Standalone directory (${STANDALONE_DIR}) does not exist.`,
        ),
    );
    echo(
        chalk.yellow(
            `Ensure 'output: "standalone"' is set in your next.config.ts/js.`,
        ),
    );
    process.exit(1);
}

echo('Running Next.js standalone postbuild script...');

await fs.ensureDir(TARGET_NEXT_DIR);

if (await fs.pathExists(`${NEXT_DIR}/static`)) {
    await spinner('Copying static files…', () =>
        fs.copy(`${NEXT_DIR}/static`, TARGET_STATIC_DIR),
    );
    echo(chalk.green('✓ Copied static files'));
} else {
    echo(chalk.yellow('⚠ No .next/static directory found, skipping.'));
}

if (await fs.pathExists('public')) {
    await spinner('Copying public directory…', () =>
        fs.copy('public', TARGET_PUBLIC_DIR),
    );
    echo(chalk.green('✓ Copied public files'));
}

await spinner(
    'Cleaning up non-standalone artifacts…',
    () =>
        $`find ${NEXT_DIR} -mindepth 1 -maxdepth 1 ! -name standalone ! -name cache -exec rm -rf {} +`,
);
echo(chalk.green('✓ Cleaned up non-standalone Next.js artifacts'));
echo(chalk.green(`✨ Standalone build finalized at ${STANDALONE_DIR}`));
echo(
    chalk.blue(
        `🌐 You can now run your app with: node ${STANDALONE_DIR}/server.js`,
    ),
);
