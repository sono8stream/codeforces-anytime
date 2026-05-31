/**
 * @jest-environment node
 */

/**
 * calculateVirtualRank 妥当性検証テスト（実 CF API 使用）
 *
 * ルール（CF公式より）:
 *   Div.1/2 (contest.type="CF"): 問題ごとの得点（時間・誤答で減衰）の合計で順位。
 *   Div.3 以降 (contest.type="ICPC"): 正解数が多い → ペナルティが少ない方が上位。
 *
 * 新アルゴリズム:
 *   - CF 型: CF スコア式で合計スコアを算出 → 公式参加者のスコアと比較して正確なランク
 *   - ICPC 型: 正解数 + ペナルティで正確なランク
 *
 * 実行: npm test -- --testPathPattern="calculateVirtualRank.validation" --watchAll=false
 */

// @ts-ignore
global.fetch = global.fetch ?? require('node-fetch');

import { calculateVirtualRank } from '../utils/calculateVirtualRank';
import { calcCFProblemScore, calcICPCPenaltyContribution } from '../utils/contestScoring';

const TIMEOUT = 90000;

// ---- ヘルパー ----

interface TestContext {
  isICPC: boolean;
  solvedCount: number;
  cfScore: number;
  penalty: number;
  strictBetterRank: number;
  sameOrBetterRank: number;
}

/**
 * standings + submissions から正確なランク範囲を計算する
 * （calculateVirtualRank の独立した参照実装として機能する）
 */
async function buildTestContext(
  handle: string,
  contestID: number,
  startTime: number
): Promise<TestContext> {
  const [standingsRes, submissionsRes] = await Promise.all([
    (global as any).fetch(`https://codeforces.com/api/contest.standings?contestId=${contestID}`),
    (global as any).fetch(`https://codeforces.com/api/user.status?handle=${handle}&count=500`),
  ]);
  const [standingsJson, submissionsJson] = await Promise.all([
    standingsRes.json(),
    submissionsRes.json(),
  ]);

  const isICPC = standingsJson.result.contest.type === 'ICPC';
  const durationSeconds: number = standingsJson.result.contest.durationSeconds;
  const maxPointsByIndex = new Map<string, number>(
    standingsJson.result.problems.map((p: any) => [p.index, p.points as number])
  );

  // このバーチャルセッションの提出を集計
  const mySubmissions = (submissionsJson.result as any[]).filter(
    (s: any) =>
      s.contestId === contestID &&
      s.author.participantType === 'VIRTUAL' &&
      s.author.startTimeSeconds === startTime
  );
  const solvedMap = new Map<string, number>();
  const wrongMap = new Map<string, number>();
  for (const s of [...mySubmissions].reverse()) {
    const idx = s.problem.index;
    if (solvedMap.has(idx)) continue;
    if (s.verdict === 'OK') solvedMap.set(idx, s.relativeTimeSeconds);
    else wrongMap.set(idx, (wrongMap.get(idx) ?? 0) + 1);
  }

  let cfScore = 0;
  let penalty = 0;
  for (const [idx, t] of solvedMap) {
    const wrongs = wrongMap.get(idx) ?? 0;
    cfScore += calcCFProblemScore(maxPointsByIndex.get(idx) ?? 0, t, wrongs, durationSeconds);
    penalty += calcICPCPenaltyContribution(t, wrongs);
  }
  const solvedCount = solvedMap.size;

  // 公式参加者の中での正確なランク範囲を計算
  const rows = (standingsJson.result.rows as any[]).filter(
    (r: any) => r.party.participantType === 'CONTESTANT' && !r.party.ghost
  );
  let strict = 0, sameOrBetter = 0;
  for (const row of rows) {
    if (isICPC) {
      const s = row.problemResults.filter((p: any) => p.points > 0).length;
      if (s > solvedCount || (s === solvedCount && row.penalty < penalty)) strict++;
      if (s > solvedCount || (s === solvedCount && row.penalty <= penalty)) sameOrBetter++;
    } else {
      // CF 型: standings の row.points は API が算出した正確なスコア
      if (row.points > cfScore) strict++;
      if (row.points >= cfScore) sameOrBetter++;
    }
  }

  return {
    isICPC,
    solvedCount,
    cfScore,
    penalty,
    strictBetterRank: strict + 1,
    sameOrBetterRank: sameOrBetter + 1,
  };
}

// ---- テストケース定義 ----

// yaaya の旧アルゴリズムによる記録（Codeforces Anytime より）
const DIV2_CASES = [
  { contestID: 1934, startTime: 1775833200, storedRank: 147,  label: 'Round 931  (4 solved)' },
  { contestID: 2001, startTime: 1775787300, storedRank: 131,  label: 'Round 967  (4 solved)' },
  { contestID: 2217, startTime: 1775775000, storedRank: 3157, label: 'Round 1091 (3 solved)' },
  { contestID: 1995, startTime: 1775466900, storedRank: 164,  label: 'Round 961  (4 solved)' },
  { contestID: 2031, startTime: 1775016600, storedRank: 79,   label: 'Round 987  (5 solved)' },
  { contestID: 2003, startTime: 1775120400, storedRank: 796,  label: 'Round 968  (4 solved)' },
  { contestID: 2059, startTime: 1774303200, storedRank: 9,    label: 'Round 1002 (5 solved)' },
  { contestID: 2067, startTime: 1774029900, storedRank: 12,   label: 'Round 1004 (5 solved)' },
];

const DIV1_DIV2_CASES = [
  { contestID: 2211, startTime: 1774872000, storedRank: 3395, label: 'Nebius Round 2 / Round 1088 (3 solved)' },
];

// ---- Div.2 テスト ----
describe('Div.2 バーチャルランク検証 (CF スタイル / yaaya)', () => {
  for (const tc of DIV2_CASES) {
    it(
      `contest ${tc.contestID} ${tc.label}: 旧ランク=${tc.storedRank}`,
      async () => {
        const ctx = await buildTestContext('yaaya', tc.contestID, tc.startTime);
        expect(ctx.isICPC).toBe(false);

        const result = await calculateVirtualRank({
          contestID: tc.contestID,
          handle: 'yaaya',
          startTime: tc.startTime,
          nowTime: Math.floor(Date.now() / 1000),
        });

        // CF スコア式で正確なランクが算出されるため [strict+1, sameOrBetter+1] に収まる
        expect(result.myRank).toBeGreaterThanOrEqual(ctx.strictBetterRank);
        expect(result.myRank).toBeLessThanOrEqual(ctx.sameOrBetterRank);
        expect(result.myRank).toBeGreaterThanOrEqual(1);

        console.log(
          `  solved=${ctx.solvedCount} cfScore=${ctx.cfScore} ` +
          `new=${result.myRank} stored=${tc.storedRank} ` +
          `range=[${ctx.strictBetterRank}, ${ctx.sameOrBetterRank}]`
        );
      },
      TIMEOUT * 2
    );
  }
});

// ---- Div.1+2 テスト ----
describe('Div.1+Div.2 バーチャルランク検証 (CF スタイル / yaaya)', () => {
  for (const tc of DIV1_DIV2_CASES) {
    it(
      `contest ${tc.contestID} ${tc.label}: 旧ランク=${tc.storedRank}`,
      async () => {
        const ctx = await buildTestContext('yaaya', tc.contestID, tc.startTime);
        expect(ctx.isICPC).toBe(false);

        const result = await calculateVirtualRank({
          contestID: tc.contestID,
          handle: 'yaaya',
          startTime: tc.startTime,
          nowTime: Math.floor(Date.now() / 1000),
        });

        expect(result.myRank).toBeGreaterThanOrEqual(ctx.strictBetterRank);
        expect(result.myRank).toBeLessThanOrEqual(ctx.sameOrBetterRank);
        expect(result.myRank).toBeGreaterThanOrEqual(1);

        console.log(
          `  solved=${ctx.solvedCount} cfScore=${ctx.cfScore} ` +
          `new=${result.myRank} stored=${tc.storedRank} ` +
          `range=[${ctx.strictBetterRank}, ${ctx.sameOrBetterRank}]`
        );
      },
      TIMEOUT * 2
    );
  }
});

// ---- Div.3 / ICPC スタイル テスト ----
describe('Div.3/ICPC バーチャルランク検証 (ICPC スタイル / maroonrk)', () => {
  it(
    'contest 2172 (ICPC Asia Taichung 2025) 全問解答: rank=1',
    async () => {
      const HANDLE = 'maroonrk';
      const CONTEST_ID = 2172;
      const START_TIME = 1764403200;

      const ctx = await buildTestContext(HANDLE, CONTEST_ID, START_TIME);
      expect(ctx.isICPC).toBe(true);

      const result = await calculateVirtualRank({
        contestID: CONTEST_ID,
        handle: HANDLE,
        startTime: START_TIME,
        nowTime: Math.floor(Date.now() / 1000),
      });

      // ICPC は正確なランクが算出される
      expect(result.myRank).toBeGreaterThanOrEqual(ctx.strictBetterRank);
      expect(result.myRank).toBeLessThanOrEqual(ctx.sameOrBetterRank);
      expect(result.myRank).toBeGreaterThanOrEqual(1);

      console.log(
        `  solved=${ctx.solvedCount} penalty=${ctx.penalty} ` +
        `new=${result.myRank} range=[${ctx.strictBetterRank}, ${ctx.sameOrBetterRank}]`
      );
    },
    TIMEOUT * 3
  );
});

// ---- 4/11 以降リグレッションテスト ----
describe('4/11以降コンテスト (修正後の動作確認)', () => {
  it(
    'contest 2215 (maroonrk, 2026/4/12): rank > 0 で正常動作',
    async () => {
      const ctx = await buildTestContext('maroonrk', 2215, 1776009000);
      const result = await calculateVirtualRank({
        contestID: 2215,
        handle: 'maroonrk',
        startTime: 1776009000,
        nowTime: Math.floor(Date.now() / 1000),
      });

      expect(result.myRank).toBeGreaterThanOrEqual(ctx.strictBetterRank);
      expect(result.myRank).toBeLessThanOrEqual(ctx.sameOrBetterRank);
      expect(result.myRank).toBeGreaterThan(0);
      expect(result.contestName).toBeTruthy();
      console.log(
        `  cfScore=${ctx.cfScore} rank=${result.myRank} ` +
        `range=[${ctx.strictBetterRank}, ${ctx.sameOrBetterRank}] contest=${result.contestName}`
      );
    },
    TIMEOUT
  );
});
