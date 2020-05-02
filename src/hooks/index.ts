import { useSelector } from 'react-redux';
import RootState from '../types/rootState';
import AccountInfo from '../types/accountInfo';
import UserProfile from '../types/userProfile';
import AvailableContestInfo from '../types/availableContestInfo';
import ContestRecord from '../types/contestRecord';

export const useAccountInfo = (): AccountInfo => {
  return useSelector((state: RootState) => state.account);
};

export const useProfile = (): UserProfile => {
  return useSelector((state: RootState) => {
    return state.profile;
  });
};

export const useAvailableContests = (): AvailableContestInfo[] => {
  return useSelector((state: RootState) => {
    return state.availableContests;
  });
};

export const useOfficialRatingRecords = (): ContestRecord[] => {
  return useSelector((state: RootState) => {
    return state.officialRatingRecords;
  });
};
