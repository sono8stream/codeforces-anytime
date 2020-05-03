import { Dispatch } from 'redux';
import actionCreatorFactory from 'typescript-fsa';
import { fetchProfileAPI } from '../api/userProfile';
import firebase from '../firebase';
import AccountInfo from '../types/accountInfo';
import ContestRecord from '../types/contestRecord';
import RootState from '../types/rootState';
import UserProfile from '../types/userProfile';
import { calculateMyRating } from '../utils/calculateMyRating';
import { calculateVirtualRank } from '../utils/calculateVirtualRank';
import { getParticipateVirtuals } from '../utils/getParticipateVirtuals';
import AvailableContestInfo from '../types/availableContestInfo';
import { fetchAvailableContestInfoAPI } from '../api/availableContestInfo';
import { fetchOfficialRatingRecordsAPI } from '../api/fetchOfficialRatingRecords';

const actionCreator = actionCreatorFactory();

export const updateProfileActions = actionCreator.async<{}, UserProfile, {}>(
  'CreateProfile'
);

export const updateProfile = (
  userID: string,
  profile: UserProfile,
  onStart?: () => void,
  onDone?: () => void,
  onFailed?: () => void
) => async (dispatch: Dispatch) => {
  updateProfileActions.started({});
  if (onStart) {
    onStart();
  }
  try {
    const storeRef = firebase.firestore().collection('users').doc(userID);
    await storeRef.set(profile, { merge: true });
    updateProfileActions.done({ params: {}, result: profile });
    if (onDone) {
      onDone();
    }
  } catch (e) {
    updateProfileActions.failed({ params: {}, error: {} });
    if (onFailed) {
      onFailed();
    }
  }
};

export const updateContestRecordsActions = actionCreator.async<
  boolean,
  { lastUpdateTime: number },
  { value: Error }
>('UpdateContestRecord');

export const addContestRecordAction = actionCreator<ContestRecord>(
  'AddContestRecord'
);

export const updateContestRecords = (
  onStart?: () => void,
  onDone?: () => void,
  onFailed?: () => void
) => async (dispatch: Dispatch, getState: () => RootState) => {
  dispatch(updateContestRecordsActions.started(false));
  if (onStart) {
    onStart();
  }
  const userID = getState().account.id;
  const { handle, lastUpdateTime } = getState().profile;
  const storeRef = firebase.firestore().collection('users').doc(userID);
  try {
    const contests = await getParticipateVirtuals(handle, lastUpdateTime);
    const nowTime = Math.floor(new Date().getTime() / 1000);
    let updateTime = lastUpdateTime;
    for (const contest of contests) {
      if (contest.id < 670) {
        continue;
      }
      try {
        const { contestName, myRank, endTime } = await calculateVirtualRank({
          contestID: contest.id,
          handle,
          startTime: contest.startTimeSeconds,
          nowTime,
        });
        const oldRating = getState().profile.rating;
        const nextRating = await calculateMyRating({
          contestID: contest.id,
          handle,
          rank: myRank,
          rating: oldRating,
        }).catch((error) => null);
        if (nextRating == null) {
          continue;
        }

        const newRecord = {
          contestID: contest.id,
          startTime: contest.startTimeSeconds,
          contestName,
          rank: myRank,
          newRating: nextRating,
          oldRating,
        };

        const doc = await storeRef.get();
        if (updateTime > doc.data()?.lastUpdateTime) {
          await storeRef.set(
            {
              lastUpdateTime: updateTime,
              rating: nextRating,
              records: [newRecord, ...getState().profile.records],
            },
            { merge: true }
          );
        }
        dispatch(addContestRecordAction(newRecord));
        updateTime = Math.max(updateTime, endTime);
      } catch (e) {
        continue;
      }
    }
    try {
    } catch (e) {}
    dispatch(
      updateContestRecordsActions.done({
        params: true,
        result: { lastUpdateTime: updateTime },
      })
    );
    if (onDone) {
      onDone();
    }
  } catch (e) {
    dispatch(
      updateContestRecordsActions.failed({
        params: true,
        error: { value: e },
      })
    );
    if (onFailed) {
      onFailed();
    }
  }
};

export const loginActions = actionCreator.async<{}, {}, { error: Error }>(
  'Login'
);

export const login = (
  provider: firebase.auth.AuthProvider,
  onStart?: () => void,
  onDone?: () => void,
  onFailed?: () => void
) => async (dispatch: Dispatch) => {
  dispatch(loginActions.started({}));
  if (onStart) {
    onStart();
  }
  try {
    const userCredential = await firebase.auth().signInWithPopup(provider);
    if (!userCredential.user) {
      throw new Error();
    }
    dispatch(
      changeAccountInfo({
        email: userCredential.user.email as string,
        id: userCredential.user.uid,
      })
    );

    dispatch(loginActions.done({ params: {}, result: {} }));
    if (onDone) {
      onDone();
    }
  } catch (error) {
    dispatch(loginActions.failed({ params: {}, error: { error } }));
    if (onFailed) {
      onFailed();
    }
  }
};

export const logoutActions = actionCreator.async<{}, {}, { error: Error }>(
  'Logout'
);

export const logout = () => async (dispatch: Dispatch) => {
  dispatch(logoutActions.started({}));
  try {
    await firebase.auth().signOut();
    dispatch(logoutActions.done({ params: {}, result: {} }));
  } catch (error) {
    dispatch(loginActions.failed({ params: {}, error: { error } }));
  }
};

export const changeAccountInfo = actionCreator<AccountInfo>(
  'ChangeAccountInfo'
);

export const fetchProfileActions = actionCreator.async<
  {},
  UserProfile,
  { error: Error }
>('FetchProfile');

export const fetchProfile = (
  userID: string,
  onDone?: () => void,
  onFailed?: () => void
) => async (dispatch: Dispatch) => {
  dispatch(fetchProfileActions.started({}));
  try {
    const profile = await fetchProfileAPI(userID);
    if (profile) {
      dispatch(fetchProfileActions.done({ params: {}, result: profile }));
      if (onDone) {
        onDone();
      }
    } else {
      throw new Error('Cannot fetch');
    }
  } catch (error) {
    dispatch(fetchProfileActions.failed({ params: {}, error: { error } }));
    if (onFailed) {
      onFailed();
    }
  }
};

export const fetchAvailableContestInfoActions = actionCreator.async<
  {},
  AvailableContestInfo[],
  { error: Error }
>('FetchAvailableContestInfo');

export const fetchAvailableContestInfo = () => async (dispatch: Dispatch) => {
  dispatch(fetchAvailableContestInfoActions.started({}));
  try {
    const contestInfoList = await fetchAvailableContestInfoAPI();

    if (contestInfoList) {
      dispatch(
        fetchAvailableContestInfoActions.done({
          params: {},
          result: contestInfoList,
        })
      );
    } else {
      throw new Error('Cannot fetch');
    }
  } catch (error) {
    dispatch(
      fetchAvailableContestInfoActions.failed({ params: {}, error: { error } })
    );
  }
};

export const fetchOfficialRatingRecordsActions = actionCreator.async<
  {},
  ContestRecord[],
  { error: Error }
>('FetchOfficialRatingInfo');

export const fetchOfficialRatingRecords = (handle: string) => async (
  dispatch: Dispatch
) => {
  dispatch(fetchOfficialRatingRecordsActions.started({}));
  try {
    const officialRatingRecords = await fetchOfficialRatingRecordsAPI(handle);

    if (officialRatingRecords) {
      dispatch(
        fetchOfficialRatingRecordsActions.done({
          params: {},
          result: officialRatingRecords,
        })
      );
    } else {
      throw new Error('Cannot fetch');
    }
  } catch (error) {
    dispatch(
      fetchOfficialRatingRecordsActions.failed({ params: {}, error: { error } })
    );
  }
};
