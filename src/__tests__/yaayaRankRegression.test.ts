/**
 * @jest-environment node
 */

/**
 * yaaya の旧実装順位と新実装順位の差異調査テスト
 *
 * 旧実装: contest.standings?showUnofficial=true でバーチャル参加者の行を直接取得しランク算出
 * 新実装: standings (official only) + user.status から独自計算
 *
 * ■ 差異が生じる 2 つの原因
 *
 * 原因A: 旧実装のCF型スコア計算が「解いた問題数」による近似だった
 *   → Round 1073 (Div.2, CF型): 旧=641 / 新=518 (diff=-123)
 *   → 新実装の方が正確（解決済み）
 *
 * 原因B: スタンディングデータがレコード作成後に変化した
 *   → CF はコンテスト後にシステムテスト・不正対策を反映してスタンディングを更新する
 *   → コンテスト当日にバーチャル参加 → 旧レコード作成 → その後スタンディングが変化
 *   → 新実装は"現在の"スタンディングに基づく正確な値を返す
 *
 *   内訳:
 *     Round 1076 (Div.3, 2026-01-27 当日バーチャル): diff=-38
 *       → 旧レコード作成時はシステムテスト完了前。38名が後日不正解→除外された
 *     Edu 185 (2026-01-21): diff=-41
 *       → 同様に後日除外
 *     Edu 120 (2026-01-09): diff=+11
 *       → 後日システムテスト確定で11名が追加された
 *     Edu 128 (2026-01-06): diff=+10
 *       → 同様に後日追加
 *
 * 実行: npm test -- --testPathPattern="yaayaRankRegression" --watchAll=false --runInBand
 * ※ CF API のレート制限のため --runInBand (シリアル実行) が必須
 */

// @ts-ignore
global.fetch = global.fetch ?? require('node-fetch');

import { calculateVirtualRank } from '../utils/calculateVirtualRank';

const TIMEOUT = 60000;
const HANDLE = 'yaaya';

// oldRank: 旧実装の記録。newRank: 新実装の期待値（現在のスタンディング基準）
const CASES = [
  // ---- 差異あり: 原因A (CF型スコア計算の改善) ----
  { contestID: 2191, startTime: 1768695300, oldRank: 641, expectedRank: 518,
    note: 'Round 1073 Div.2: 旧は解いた問題数近似 → 新はCFスコア式で正確' },

  // ---- 差異あり: 原因B (スタンディングデータの変化) ----
  { contestID: 2193, startTime: 1769508600, oldRank:  64, expectedRank:  26,
    note: 'Round 1076 Div.3: 当日バーチャル → システムテスト前のデータで旧レコード作成' },
  { contestID: 2170, startTime: 1769002200, oldRank: 390, expectedRank: 349,
    note: 'Edu 185: 後日除外参加者あり' },
  { contestID: 1622, startTime: 1767960000, oldRank: 108, expectedRank: 119,
    note: 'Edu 120: 後日確定参加者が追加' },
  { contestID: 1680, startTime: 1767701400, oldRank:  87, expectedRank:  97,
    note: 'Edu 128: 後日確定参加者が追加' },

  // ---- 差異なし: リグレッション確認 ----
  { contestID: 1550, startTime: 1769430600, oldRank: 838, expectedRank: 838, note: 'Edu 111' },
  { contestID: 1401, startTime: 1769081400, oldRank: 1022, expectedRank: 1022, note: 'Round 665 Div.2' },
  { contestID: 1422, startTime: 1768824000, oldRank: 122, expectedRank: 122, note: 'Round 675 Div.2' },
  { contestID: 1569, startTime: 1768617000, oldRank: 302, expectedRank: 302, note: 'Edu 113' },
  { contestID: 1574, startTime: 1768518300, oldRank: 135, expectedRank: 135, note: 'Edu 114' },
];

describe('yaaya 順位検証 (新実装の期待値で比較)', () => {
  for (const tc of CASES) {
    it(`${tc.note} (contest ${tc.contestID})`, async () => {
      const result = await calculateVirtualRank({
        contestID: tc.contestID,
        handle: HANDLE,
        startTime: tc.startTime,
        nowTime: Math.floor(Date.now() / 1000),
      });

      const match = result.myRank === tc.expectedRank;
      console.log(
        `  ${tc.note}: ` +
        `old=${tc.oldRank} expected=${tc.expectedRank} actual=${result.myRank} ` +
        (match ? '✓' : `✗ diff=${result.myRank - tc.expectedRank}`)
      );

      expect(result.myRank).toBe(tc.expectedRank);
    }, TIMEOUT);
  }
});
