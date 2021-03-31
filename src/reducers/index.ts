import { combineReducers } from 'redux';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import {
  addContestRecordAction,
  changeAccountInfo,
  fetchAvailableContestInfoActions,
  fetchOfficialRatingRecordsActions,
  fetchProfileActions,
  fetchUsersActions,
  logoutActions,
  updateContestRecordsActions,
  updateProfileActions,
} from '../actions';
import AccountInfo from '../types/accountInfo';
import AvailableContestInfo from '../types/availableContestInfo';
import ContestRecord from '../types/contestRecord';
import RootState from '../types/rootState';
import UserProfile from '../types/userProfile';

const profileReducer = reducerWithInitialState<UserProfile>({
  handle: '',
  lastUpdateTime: 0,
  rating: 0,
  records: [],
  registrationTime: 0,
})
  .case(updateProfileActions.done, (prev, payload) => payload.result)
  .case(fetchProfileActions.done, (prev, payload) => payload.result)
  .case(addContestRecordAction, (prev, payload) => {
    const records = [payload.record, ...prev.records];
    const rating = payload.record.newRating;
    return { ...prev, rating, records };
  })
  .case(updateContestRecordsActions.done, (prev, payload) => ({
    ...prev,
    lastUpdateTime: payload.result.lastUpdateTime,
  }))
  .case(logoutActions.done, (prev, payload) => ({
    handle: '',
    lastUpdateTime: 0,
    rating: 0,
    records: [],
    registrationTime: 0,
  }));

const availableContestsResucer = reducerWithInitialState<
  AvailableContestInfo[]
>([]).case(
  fetchAvailableContestInfoActions.done,
  (prev, payload) => payload.result
);

const officialRatingRecordsReducer = reducerWithInitialState<ContestRecord[]>(
  []
).case(
  fetchOfficialRatingRecordsActions.done,
  (prev, payload) => payload.result
);

const isUpdatingRatingReducer = reducerWithInitialState<boolean>(false)
  .case(updateContestRecordsActions.started, () => true)
  .case(updateContestRecordsActions.done, () => false)
  .case(updateContestRecordsActions.failed, () => false);

const accountReducer = reducerWithInitialState<AccountInfo>({
  email: '',
  id: '',
})
  .case(changeAccountInfo, (prev, payload) => payload)
  .case(logoutActions.done, (prev, payload) => ({
    checked: false,
    email: '',
    id: '',
  }));

const usersReducer = reducerWithInitialState<{ [id: string]: UserProfile }>({})
  .case(fetchUsersActions.done, (prev, payload) => payload.result)
  .case(updateProfileActions.done, (prev, payload) => {
    return { ...prev, [payload.params.id]: payload.result };
  })
  .case(addContestRecordAction, (prev, payload) => {
    const profile = prev[payload.id];
    profile.records = [payload.record, ...profile.records];
    profile.rating = payload.record.newRating;
    return { ...prev, [payload.id]: profile };
  });

const rootReducer = combineReducers<RootState>({
  profile: profileReducer,
  availableContests: availableContestsResucer,
  officialRatingRecords: officialRatingRecordsReducer,
  isUpdatingRating: isUpdatingRatingReducer,
  users: usersReducer,
  account: accountReducer,
});

export default rootReducer;
