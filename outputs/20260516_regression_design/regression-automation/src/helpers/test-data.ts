export const TEST_PROJECTS = {
  hangzhouDecheng: {
    name: '杭州德诚测试项目',
    accountSet: '杭州德诚',
    tenantId: 'tenant-hz-decheng',
  },
  quzhouGuangze: {
    name: '衢州广泽测试项目',
    accountSet: '衢州广泽',
    tenantId: 'tenant-qz-guangze',
  },
} as const;

export const BUG_IDS = {
  PTYR_2674: 'PTYR-2674',
  PTYR_2595: 'PTYR-2595',
  PTYR_2588: 'PTYR-2588',
  PTYR_2576: 'PTYR-2576',
  PTYR_2567: 'PTYR-2567',
  PTYR_2561: 'PTYR-2561',
  PTYR_2560: 'PTYR-2560',
  PTYR_2554: 'PTYR-2554',
  PTYR_2543: 'PTYR-2543',
  PTYR_2533: 'PTYR-2533',
  PTYR_2492: 'PTYR-2492',
  PTYR_2450: 'PTYR-2450',
  PTYR_2355: 'PTYR-2355',
  PTYR_1921: 'PTYR-1921',
  PTYR_1824: 'PTYR-1824',
  PTYR_1781: 'PTYR-1781',
  PTYR_1779: 'PTYR-1779',
  PTYR_1760: 'PTYR-1760',
  PTYR_1747: 'PTYR-1747',
  PTYR_1713: 'PTYR-1713',
  PTYR_1694: 'PTYR-1694',
  PTYR_1693: 'PTYR-1693',
  PTYR_1421: 'PTYR-1421',
  PTYR_1296: 'PTYR-1296',
} as const;

export function tag(bugId: string, priority: string): string[] {
  return ['@regression', `@${priority}`, `@bug-${bugId}`];
}
