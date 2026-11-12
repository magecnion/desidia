import { cp, rm, stat } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import { resolveContentDirectory } from './content-path.mjs';

async function prepareMedia(destination, directory) {
  directory ??= await resolveContentDirectory();
  await rm(destination, { recursive: true, force: true });
  const source = join(directory, 'media');
  const media = await stat(source).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (media && !media.isDirectory()) throw new Error('Content media must be a directory');
  if (media) {
    await cp(source, destination, {
      recursive: true,
      filter: path => !['README.md', '.gitkeep'].includes(basename(path)),
    });
  }
}

export default function mediaIntegration() {
  let destination;
  let dispose;
  return {
    name: 'cms-media',
    hooks: {
      'astro:config:done': ({ config }) => {
        destination = new URL('content/media/', config.publicDir);
      },
      'astro:build:start': async () => {
        await prepareMedia(destination);
      },
      'astro:server:setup': async ({ server, logger }) => {
        const directory = await resolveContentDirectory();
        const source = join(directory, 'media');
        let pending = Promise.resolve();
        let timer;
        const synchronize = () => {
          pending = pending.then(() => prepareMedia(destination, directory)).catch(error => {
            logger.error(`Media synchronization failed: ${error.message}`);
          });
        };
        const onChange = (_event, path) => {
          path = resolve(path);
          if (path !== directory && path !== source && !path.startsWith(source + sep)) return;
          clearTimeout(timer);
          timer = setTimeout(synchronize, 50);
        };
        // Watch the parent too so deleting and recreating media remains observable.
        // Vite owns and closes this watcher along with the dev server.
        server.watcher.add(directory);
        server.watcher.on('all', onChange);
        dispose = async () => {
          server.watcher.off('all', onChange);
          clearTimeout(timer);
          await pending;
        };
        // Queue startup with subsequent updates so cleanup and copying cannot overlap.
        pending = prepareMedia(destination, directory);
        await pending;
      },
      'astro:server:done': async () => {
        await dispose?.();
      },
    },
  };
}
