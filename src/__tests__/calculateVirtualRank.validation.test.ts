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
 *   - ICPC 型: 正解数 + ペナルティ（10分/誤答）で正確なランク
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
 * standings + submissions から正確なランクを計算する参照実装。
 * calculateVirtualRank と独立して実装し、両者の一致を確認する。
 */
async function buildTestContext(
  handle: string,
  contestID: number,
  startTime: number
): Promise<TestContext> {
  const [standingsRes, submissionsRes, ratingChangesRes] = await Promise.all([
    (global as any).fetch(`https://codeforces.com/api/contest.standings?contestId=${contestID}`),
    (global as any).fetch(`https://codeforces.com/api/user.status?handle=${handle}&count=500`),
    (global as any).fetch(`https://codeforces.com/api/contest.ratingChanges?contestId=${contestID}`),
  ]);
  const [standingsJson, submissionsJson, ratingChangesJson] = await Promise.all([
    standingsRes.json(),
    submissionsRes.json(),
    ratingChangesRes.json(),
  ]);

  const ratedHandles: Set<string> | null =
    ratingChangesJson.status === 'OK' && ratingChangesJson.result.length > 0
      ? new Set((ratingChangesJson.result as { handle: string }[]).map((r) => r.handle))
      : null;

  const isICPC = standingsJson.result.contest.type === 'ICPC';
  const durationSeconds: number = standingsJson.result.contest.durationSeconds;
  const maxPointsByIndex = new Map<string, number>(
    standingsJson.result.problems.map((p: any) => [p.index, p.points as number])
  );

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

  const rows = (standingsJson.result.rows as any[]).filter((r: any) => {
    if (r.party.participantType !== 'CONTESTANT' || r.party.ghost) return false;
    if (ratedHandles !== null) return ratedHandles.has(r.party.members[0]?.handle);
    return true;
  });
  let strict = 0, sameOrBetter = 0;
  for (const row of rows) {
    if (isICPC) {
      const s = row.problemResults.filter((p: any) => p.points > 0).length;
      if (s > solvedCount || (s === solvedCount && row.penalty < penalty)) strict++;
      if (s > solvedCount || (s === solvedCount && row.penalty <= penalty)) sameOrBetter++;
    } else {
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

async function assertRank(
  handle: string,
  contestID: number,
  startTime: number
) {
  const ctx = await buildTestContext(handle, contestID, startTime);
  const result = await calculateVirtualRank({
    contestID,
    handle,
    startTime,
    nowTime: Math.floor(Date.now() / 1000),
  });

  console.log(
    `  ${handle} contest=${contestID} ` +
    `solved=${ctx.solvedCount} ` +
    (ctx.isICPC ? `penalty=${ctx.penalty}` : `cfScore=${ctx.cfScore}`) +
    ` rank=${result.myRank} range=[${ctx.strictBetterRank}, ${ctx.sameOrBetterRank}]`
  );

  // buildTestContext と calculateVirtualRank は同じアルゴリズム・同じデータを参照するため一致する
  expect(result.myRank).toBe(ctx.strictBetterRank);
  expect(result.myRank).toBeGreaterThanOrEqual(1);
  return ctx;
}

// ---- テストケース定義 ----

// yaaya の記録
const DIV2_CASES = [
  { contestID: 1934, startTime: 1775833200, label: 'Round 931  (Div.2, 4 solved)' },
  { contestID: 2001, startTime: 1775787300, label: 'Round 967  (Div.2, 4 solved)' },
  { contestID: 2217, startTime: 1775775000, label: 'Round 1091 (Div.2, 3 solved)' },
  { contestID: 1995, startTime: 1775466900, label: 'Round 961  (Div.2, 4 solved)' },
  { contestID: 2031, startTime: 1775016600, label: 'Round 987  (Div.2, 5 solved)' },
  { contestID: 2003, startTime: 1775120400, label: 'Round 968  (Div.2, 4 solved)' },
  { contestID: 2059, startTime: 1774303200, label: 'Round 1002 (Div.2, 5 solved)' },
  { contestID: 2067, startTime: 1774029900, label: 'Round 1004 (Div.2, 5 solved)' },
];

const DIV1_DIV2_CASES = [
  { contestID: 2211, startTime: 1774872000, label: 'Nebius Round 2 / Round 1088 (Div.1+2, 3 solved)' },
];

// maroonrk の記録（Div.1）
const DIV1_CASES = [
  { contestID: 2089, startTime: 1749762000, label: 'Round 1012 (Div.1)'        },
  { contestID: 2097, startTime: 1746015600, label: 'Round 1021 (Div.1)'        },
  { contestID: 2101, startTime: 1747404000, label: 'Round 1024 (Div.1)'        },
];

// ICPC 型: maroonrk（ICPC Asia） + yaaya（Educational）
const ICPC_CASES = [
  { handle: 'maroonrk', contestID: 2172, startTime: 1764403200, label: 'ICPC Asia Taichung 2025 (全問解答)' },
  { handle: 'yaaya',    contestID: 2230, startTime: 1779154500, label: 'Educational Round 190'             },
];

// ---- Div.2 テスト（CF 型）----

describe('Div.2 バーチャルランク検証 (CF 型 / yaaya)', () => {
  for (const tc of DIV2_CASES) {
    it(`contest ${tc.contestID} ${tc.label}`, async () => {
      const ctx = await assertRank('yaaya', tc.contestID, tc.startTime);
      expect(ctx.isICPC).toBe(false);
    }, TIMEOUT * 2);
  }
});

// ---- Div.1+2 テスト（CF 型）----

describe('Div.1+Div.2 バーチャルランク検証 (CF 型 / yaaya)', () => {
  for (const tc of DIV1_DIV2_CASES) {
    it(`contest ${tc.contestID} ${tc.label}`, async () => {
      const ctx = await assertRank('yaaya', tc.contestID, tc.startTime);
      expect(ctx.isICPC).toBe(false);
    }, TIMEOUT * 2);
  }
});

// ---- Div.1 テスト（CF 型）----

describe('Div.1 バーチャルランク検証 (CF 型 / maroonrk)', () => {
  for (const tc of DIV1_CASES) {
    it(`contest ${tc.contestID} ${tc.label}`, async () => {
      const ctx = await assertRank('maroonrk', tc.contestID, tc.startTime);
      expect(ctx.isICPC).toBe(false);
    }, TIMEOUT * 2);
  }
});

// ---- ICPC 型テスト（Div.3/Educational）----

describe('ICPC 型バーチャルランク検証', () => {
  for (const tc of ICPC_CASES) {
    it(`contest ${tc.contestID} ${tc.label} (${tc.handle})`, async () => {
      const ctx = await assertRank(tc.handle, tc.contestID, tc.startTime);
      expect(ctx.isICPC).toBe(true);
    }, TIMEOUT * 3);
  }
});

// ---- 4/11 以降リグレッションテスト ----

describe('4/11以降コンテスト (修正後の動作確認)', () => {
  it('contest 2215 (maroonrk, 2026/4/12): API変更後も正常動作', async () => {
    await assertRank('maroonrk', 2215, 1776009000);
  }, TIMEOUT);
});
