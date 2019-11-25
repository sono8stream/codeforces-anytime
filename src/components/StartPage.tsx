import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Header, Icon, List, Loader, Segment } from 'semantic-ui-react';
import { login } from '../actions';
import firebase from '../firebase';
import history from '../history';
import { useAccountInfo } from '../hooks';

const StartPage: React.FC = () => {
  const dispatch = useDispatch();
  const account = useAccountInfo();
  const [onLoging, setOnLoging] = useState(false);

  const onGoogleLogin = useCallback(() => {
    dispatch(
      login(
        new firebase.auth.GoogleAuthProvider(),
        () => setOnLoging(true),
        () => {
          setOnLoging(false);
          history.push('profile');
        },
        () => setOnLoging(false)
      )
    );
  }, [dispatch]);

  const onGithubLogin = useCallback(() => {
    dispatch(
      login(
        new firebase.auth.GithubAuthProvider(),
        () => setOnLoging(true),
        () => {
          setOnLoging(false);
          history.push('profile');
        },
        () => setOnLoging(false)
      )
    );
  }, [dispatch]);

  return (
    <div>
      <Header as="h2">
        <Header.Content>
          Anytime R<span style={{ color: 'red' }}>ated</span> in Codeforces
          contests!
        </Header.Content>
        <Header.Subheader>
          Codeforces
          Virtualコンテストの結果のみを用いてレート変動をプロットするサービスです．
          <br />
          自分のペースで好きな時間にレートを上げていくことができます．
        </Header.Subheader>
      </Header>
      <Header as="h3">How to use</Header>
      <List ordered={true}>
        <List.Item>
          <a href="https://codeforces.com" target="blank">
            Codeforces
          </a>
          のアカウントが必要です
        </List.Item>
        <List.Item>Google/Githubアカウントでこのサービスにログイン</List.Item>
        <List.Item>
          <a href="https://codeforces.com" target="blank">
            Codeforces
          </a>
          上でVirtual Contestに参加
        </List.Item>
        <List.Item>このサービスのプロフィールページでレート更新</List.Item>
      </List>
      {(() => {
        if (account.id) {
          return (
            <Button
              content="Go to profile"
              basic={true}
              color="green"
              onClick={() => {
                history.push('/profile');
              }}
            />
          );
        } else {
          return (
            <div>
              <Button basic={true} color="red" onClick={onGoogleLogin}>
                <Icon name="google" />
                Login with Google
              </Button>
              <Button basic={true} color="black" onClick={onGithubLogin}>
                <Icon name="github" />
                Login with Github
              </Button>
              <Loader inline={true} active={onLoging} />
            </div>
          );
        }
      })()}
      <Segment>
        <Header as="h5" color="red">
          注意点
        </Header>
        <List bulleted={true}>
          <List.Item>
            レート計算の仕組みが異なるため，2016/6以前に開催されたコンテストは無効です
          </List.Item>
          <List.Item>
            レート更新はプロフィールページにアクセスした際に自動的に行われます
          </List.Item>
          <List.Item>
            レート更新処理では，1コンテストあたり30秒前後の計算時間が発生します
          </List.Item>
        </List>
      </Segment>
    </div>
  );
};

export default StartPage;
