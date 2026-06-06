import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { PageWrapper as SharedPageWrapper } from '../anytime-ui';
import { changeAccountInfo, logout } from '../actions';
import firebase from '../firebase';
import { useAccountInfo } from '../hooks';

const PageWrapper: React.FC<{ children: any }> = ({ children }) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const account = useAccountInfo();

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user === null || user.email === null) {
        return;
      }
      dispatch(changeAccountInfo({ email: user.email, id: user.uid }));
    });
    return () => {
      unsubscribe();
    };
  }, [dispatch, history]);

  return (
    <SharedPageWrapper
      appName="Codeforces Anytime"
      accountId={account.id}
      onNavigateHome={() => history.push('/')}
      onNavigateContests={() => history.push('/contests')}
      onNavigateRanking={() => history.push('/ranking')}
      onNavigateProfile={() => history.push(`/users/${account.id}`)}
      onLogout={() => dispatch(logout())}
      onNavigateContact={() => history.push('/contact')}
    >
      {children}
    </SharedPageWrapper>
  );
};

export default PageWrapper;
