import { isNil } from 'ramda';
import { z } from 'zod';

import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const packageSchema = z.object({
  bin: z.union([z.string().min(1), z.record(z.string(), z.string().min(1))]),
});

/** installed packageの宣言だけを使い、存在するpackage内の通常fileをCLIとして解決する。 */
export const resolveStorybookVerificationCli = (
  root: string,
  name: 'storybook' | 'vite',
) => {
  const require = createRequire(join(root, 'package.json'));
  const packageFile = realpathSync(require.resolve(`${name}/package.json`));
  const metadata = packageSchema.parse(
    JSON.parse(readFileSync(packageFile, 'utf8')),
  );
  const bin =
    typeof metadata.bin === 'string' ? metadata.bin : metadata.bin[name];
  if (isNil(bin) || isAbsolute(bin))
    throw new Error('CLIのbin宣言が不正です。');
  const directory = dirname(packageFile);
  const cli = resolve(directory, bin);
  const child = relative(directory, cli);
  if (child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child))
    throw new Error('CLIがpackage外を参照しています。');
  const stat = lstatSync(cli);
  if (!stat.isFile() || stat.isSymbolicLink() || realpathSync(cli) !== cli)
    throw new Error('CLIが通常fileではありません。');
  return cli;
};
