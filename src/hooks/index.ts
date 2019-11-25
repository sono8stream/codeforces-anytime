import { useSelector } from 'react-redux';
import RootState from '../types/rootState';
import AccountInfo from '../types/accountInfo';
import UserProfile from '../types/userProfile';

export const useAccountInfo = (): AccountInfo => {
  return useSelector((state: RootState) => state.accountReducer);
};

export const useProfile = (): UserProfile => {
  return useSelector((state: RootState) => {
    return state.profileReducer;
  });
};
