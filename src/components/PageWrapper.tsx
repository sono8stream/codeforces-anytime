import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Container, Divider, Menu, Segment } from 'semantic-ui-react';
import { changeAccountInfo, logout } from '../actions';
import firebase from '../firebase';
import history from '../history';
import { useAccountInfo } from '../hooks';

const PageWrapper: React.FC<{ children: any }> = ({ children }) => {
  const dispatch = useDispatch();
  const account = useAccountInfo();

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user === null || user.email === null) {
        history.push('/');
        return;
      }
      dispatch(changeAccountInfo({ email: user.email, id: user.uid }));
    });
    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
      }}
    >
      <Menu fixed="top" inverted={true} style={{ overflow: 'auto' }}>
        <Menu.Item
          header={true}
          onClick={() => {
            history.push('/');
          }}
        >
          Codeforces Anytime
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            history.push('/contests');
          }}
        >
          Contests
        </Menu.Item>
        {(() => {
          if (account.id) {
            return (
              <>
                <Menu.Item
                  position="right"
                  onClick={() => {
                    history.push('/profile');
                  }}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  onClick={() => {
                    dispatch(logout());
                  }}
                >
                  Logout
                </Menu.Item>
              </>
            );
          } else {
            return null;
          }
        })()}
      </Menu>
      <Container text={true} style={{ marginTop: '6em', flex: 1 }}>
        {children}
      </Container>
      <div style={{ height: '5em' }} />
      <Segment inverted={true} vertical={true} style={{ padding: '2em 0em' }}>
        <Container textAlign="center">
          <Button
            basic={true}
            inverted={true}
            onClick={() => {
              history.push('/contact');
            }}
          >
            Contact Me
          </Button>
          <Divider inverted={true} />
          <p>Copyright © 2019 sono. All rights reserved.</p>
        </Container>
      </Segment>
    </div>
  );
};

export default PageWrapper;
