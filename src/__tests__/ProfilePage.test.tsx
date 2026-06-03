import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import ProfilePage from '../pages/ProfilePage';
import UserProfile from '../types/userProfile';
import rootReducer from '../reducers';

// ---- router mock ----
const mockPush = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'user1' }),
  useLocation: () => ({ search: '' }),
  useHistory: () => ({ push: mockPush }),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---- firebase mock ----
jest.mock('../firebase', () => ({ default: {} }));

// ---- API layer mock ----
// アクションクリエーターは実物を使い、API呼び出しだけをモックする
jest.mock('../api/fetchUsers', () => ({
  fetchUsersAPI: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../api/userProfile', () => ({
  fetchProfileAPI: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../api/availableContestInfo', () => ({
  fetchAvailableContestInfoAPI: jest.fn(() => Promise.resolve([])),
}));

// ---- recharts mock (jsdom は SVG レイアウト未サポート) ----
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  ScatterChart: ({ children }: any) => <div>{children}</div>,
  Scatter: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

import { fetchUsersAPI } from '../api/fetchUsers';
const mockFetchUsersAPI = fetchUsersAPI as jest.Mock;

// ---- test data ----
const user1: UserProfile = {
  handle: 'user1',
  rating: 1500,
  lastUpdateTime: 1609459200,
  registrationTime: 1577836800,
  records: [
    {
      contestID: 1320,
      startTime: 1609459200,
      contestName: 'Codeforces Round #630',
      rank: 100,
      newRating: 1500,
      oldRating: 1400,
      performance: 1600,
    },
  ],
};

function makeStore(preloadedUsers: { [id: string]: UserProfile }) {
  // usersReducer の初期状態を上書きするため、一度ストアを作ってから
  // fetchUsersActions.done を dispatch してusersを注入する
  const store = createStore(rootReducer, applyMiddleware(thunk));
  if (Object.keys(preloadedUsers).length > 0) {
    // users を直接注入するため fetchUsersActions を使う
    const { fetchUsersActions } = require('../actions');
    store.dispatch(fetchUsersActions.done({ params: {}, result: preloadedUsers }));
  }
  return store;
}

function renderProfilePage(users: { [id: string]: UserProfile }) {
  const store = makeStore(users);
  render(
    <Provider store={store}>
      <ProfilePage />
    </Provider>
  );
}

// ---- tests ----
beforeEach(() => {
  mockFetchUsersAPI.mockClear();
  mockPush.mockClear();
});

describe('ProfilePage / fetchUsers の呼び出し', () => {
  it('users が空のとき fetchUsersAPI を呼ぶ', async () => {
    renderProfilePage({});
    // useEffect は非同期で実行されるため少し待つ
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetchUsersAPI).toHaveBeenCalledTimes(1);
  });

  it('users が既に存在していても fetchUsersAPI を呼ぶ（別ページから遷移した場合も最新データを取得）', async () => {
    // 修正前: Object.keys(users).length === 0 の場合しか fetchUsers を呼ばず、
    // 別ユーザーページから遷移した際に古いデータが表示されてしまうバグがあった
    renderProfilePage({ user1 });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetchUsersAPI).toHaveBeenCalledTimes(1);
  });
});
