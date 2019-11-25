import { combineReducers } from 'redux';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import {
  addContestRecordAction,
  changeAccountInfo,
  fetchProfileActions,
  logoutActions,
  updateContestRecordsActions,
  updateProfileActions,
} from '../actions';
import AccountInfo from '../types/accountInfo';
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
    const contestRecord = [payload, ...prev.records];
    return { ...prev, records: contestRecord };
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

const rootReducer = combineReducers({ profileReducer, accountReducer });

export default rootReducer;
