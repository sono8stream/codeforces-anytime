/**
 * @jest-environment node
 */

/**
 * calculateVirtualRank の CF API 統合テスト
 *
 * issue #58: 2026/4/11 以降のコンテスト結果が反映されない
 * 根本原因: CF API が contest.standings?showUnofficial=true を非管理者に禁止
 *
 * このテストは実際の Codeforces API を叩く（ネットワーク必要）
 *
 * テストユーザー: maroonrk
 *   - contest 2215 (Codeforces Round 1092) に 2026/4/12 にバーチャル参加済み
 *   - virtualStartTime: 1776009000
 */

// node 環境には fetch がないため polyfill
// @ts-ignore
global.fetch = global.fetch ?? require('node-fetch');

import { calculateVirtualRank } from '../utils/calculateVirtualRank';

const TIMEOUT = 30000;

const MAROONRK_VIRTUAL = {
  contestID: 2215,
  handle: 'maroonrk',
  startTime: 1776009000, // 2026-04-12T15:50:00Z
  nowTime: Math.floor(Date.now() / 1000),
};

describe('calculateVirtualRank CF API integration', () => {
  it(
    '【バグ再現】CF API が showUnofficial=true を拒否することを確認',
    async () => {
      // この挙動が issue #58 の根本原因
      const res = await fetch(
        `https://codeforces.com/api/contest.standings?contestId=${MAROONRK_VIRTUAL.contestID}&showUnofficial=true`
      );
      const json = await res.json();
      expect(json.status).toBe('FAILED');
      expect(json.comment).toContain('no extra parameters');
    },
    TIMEOUT
  );

  it(
    '【修正後】2026/4/11 以降の contest で myRank が正常に取得できること',
    async () => {
      // 修正前はここで throw される（showUnofficial=true が弾かれるため）
      const result = await calculateVirtualRank(MAROONRK_VIRTUAL);

      const contestDuration = 10800; // 3 hours
      expect(result.contestName).toContain('1092');
      expect(result.myRank).toBe(1); // maroonrk は公式参加者全員より高スコア
      expect(result.endTime).toBe(MAROONRK_VIRTUAL.startTime + contestDuration);
    },
    TIMEOUT
  );
});
