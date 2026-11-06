import { expect, it } from 'vitest';

import { environmentLockHosts } from './environmentLock';

const common = { mac: '00:00:00:00:00:00', internal: false, cidr: null };
const ipv6 = {
  ...common,
  family: 'IPv6',
  netmask: 'ffff:ffff:ffff:ffff::',
  scopeid: 7,
} as const;

it.each([
  ['linux', 'eth0'],
  ['darwin', 'eth0'],
  ['win32', '7'],
] as const)('%sでIPv6に必要なスコープだけを付ける', (platform, scope) => {
  const hosts = environmentLockHosts(
    {
      eth0: [
        { ...ipv6, address: 'fe80::1' },
        { ...ipv6, address: 'fe80::2%existing' },
        { ...ipv6, address: '2001:db8::1', scopeid: 0 },
        {
          ...common,
          family: 'IPv4',
          address: '192.0.2.1',
          netmask: '255.255.255.0',
        },
      ],
      unavailable: undefined,
    },
    platform,
  );

  expect([...hosts]).toEqual([
    '0.0.0.0',
    '127.0.0.1',
    '::',
    '::1',
    `fe80::1%${scope}`,
    'fe80::2%existing',
    '2001:db8::1',
    '192.0.2.1',
  ]);
});
