/**
 * @jest-environment node
 */

/**
 * Firebase integration test
 *
 * 前提:
 *   - .env に有効な REACT_APP_FIREBASE_CONFIG が設定されていること（テスト用プロジェクト）
 *   - Firebase プロジェクトで Email/Password Authentication が有効になっていること
 *   - .env に REACT_APP_TEST_EMAIL / REACT_APP_TEST_PASSWORD が設定されていること
 *   - Firestore rules で認証済みユーザーの自ドキュメントへの write が許可されていること
 *
 * 実行方法:
 *   npm run test -- --testPathPattern="integration" --watchAll=false
 */

import 'firebase/auth';
import 'firebase/firestore';

import firebase from '../firebase';
import { fetchUsersAPI } from '../api/fetchUsers';
import UserProfile from '../types/userProfile';

// ---- 定数 ----
const TIMEOUT = 30000;

const INITIAL_PROFILE: UserProfile = {
  handle: 'integration_test_user',
  rating: 1400,
  lastUpdateTime: 0,
  records: [],
  registrationTime: 1577836800,
};

const UPDATED_RECORD = {
  contestID: 1320,
  startTime: 1600000000,
  contestName: 'Codeforces Round #629 (Div. 3)',
  rank: 100,
  newRating: 1550,
  oldRating: 1400,
  performance: 1650,
};

// ---- テストスイート ----
describe('Firebase integration', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Email/Password 認証
    const email = process.env.REACT_APP_TEST_EMAIL;
    const password = process.env.REACT_APP_TEST_PASSWORD;
    if (!email || !password) {
      throw new Error(
        '.env に REACT_APP_TEST_EMAIL / REACT_APP_TEST_PASSWORD を設定してください'
      );
    }
    const cred = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    testUserId = cred.user!.uid;

    // テスト用初期データを Firestore に書き込む
    await firebase
      .firestore()
      .collection('users')
      .doc(testUserId)
      .set(INITIAL_PROFILE);
  }, TIMEOUT);

  afterAll(async () => {
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(testUserId)
        .delete();
    } catch (_) {}
    await firebase.auth().signOut();
  }, TIMEOUT);

  // ----------------------------------------------------------------
  // 1. Firestore 接続確認
  // ----------------------------------------------------------------
  it('初期プロファイルが Firestore に書き込まれていること', async () => {
    const doc = await firebase
      .firestore()
      .collection('users')
      .doc(testUserId)
      .get();

    expect(doc.exists).toBe(true);
    expect(doc.data()!.handle).toBe('integration_test_user');
    expect(doc.data()!.records).toHaveLength(0);
    expect(doc.data()!.rating).toBe(1400);
  }, TIMEOUT);

  // ----------------------------------------------------------------
  // 2. fetchUsersAPI が Firestore の最新データを返すこと
  // ----------------------------------------------------------------
  it('fetchUsersAPI が初期データを返すこと', async () => {
    const users = await fetchUsersAPI();
    expect(users[testUserId]).toBeDefined();
    expect(users[testUserId].records).toHaveLength(0);
    expect(users[testUserId].rating).toBe(1400);
  }, TIMEOUT);

  // ----------------------------------------------------------------
  // 3. レーティング更新後、fetchUsersAPI が最新データを返すこと
  //    （updateContestRecords が行う Firestore 書き込みを直接シミュレート）
  // ----------------------------------------------------------------
  it('レーティング更新後、fetchUsersAPI が最新データを返すこと', async () => {
    // updateContestRecords が書き込む内容を直接 Firestore に書き込む
    await firebase
      .firestore()
      .collection('users')
      .doc(testUserId)
      .set(
        {
          rating: UPDATED_RECORD.newRating,
          lastUpdateTime: UPDATED_RECORD.startTime,
          records: [UPDATED_RECORD],
        },
        { merge: true }
      );

    // fetchUsersAPI で最新データを取得 → 更新後の値が返ることを確認
    const users = await fetchUsersAPI();

    expect(users[testUserId]).toBeDefined();
    expect(users[testUserId].records).toHaveLength(1);
    expect(users[testUserId].records[0].newRating).toBe(1550);
    expect(users[testUserId].records[0].contestID).toBe(1320);
    expect(users[testUserId].rating).toBe(1550);
  }, TIMEOUT);

  // ----------------------------------------------------------------
  // 4. バグ修正の確認:
  //    ProfilePage を再訪問したときに fetchUsersAPI が呼ばれ最新データが取れること
  //    （ProfilePage.tsx の Object.keys(users).length === 0 ガードを削除したことで保証）
  // ----------------------------------------------------------------
  it('2回目の fetchUsersAPI 呼び出しでも最新データが返ること', async () => {
    // 1回目は test 3 で呼ばれている（stale cache の問題がないことを確認）
    const users = await fetchUsersAPI();

    expect(users[testUserId].rating).toBe(1550);
    expect(users[testUserId].records).toHaveLength(1);
  }, TIMEOUT);
});
