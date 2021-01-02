import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { Button, Header, Icon, List, Loader, Segment } from 'semantic-ui-react';
import { login } from '../actions';
import firebase from '../firebase';
import { useAccountInfo } from '../hooks';

const StartPage: React.FC = () => {
  const history = useHistory();
  const queryParams = new URLSearchParams(useLocation().search);

  const dispatch = useDispatch();
  const account = useAccountInfo();
  const [onLoging, setOnLoging] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);

  useEffect(() => {
    if (queryParams.get('lang')) {
      setIsEnglish(queryParams.get('lang') === 'en');
    }
  }, []);

  const onGoogleLogin = useCallback(() => {
    dispatch(
      login(
        new firebase.auth.GoogleAuthProvider(),
        () => setOnLoging(true),
        () => {
          setOnLoging(false);
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
        },
        () => setOnLoging(false)
      )
    );
  }, [dispatch]);

  return (
    <>
      <Button.Group floated="right">
        <Button
          compact={true}
          positive={!isEnglish}
          onClick={() => {
            if (isEnglish) {
              setIsEnglish(false);
            }
          }}
        >
          JP
        </Button>
        <Button.Or />
        <Button
          compact={true}
          positive={isEnglish}
          onClick={() => {
            if (!isEnglish) {
              setIsEnglish(true);
            }
          }}
        >
          EN
        </Button>
      </Button.Group>
      <Header as="h2">
        <Header.Content>
          Anytime R<span style={{ color: 'red' }}>ated</span> in Codeforces
          contests!
        </Header.Content>
        <Header.Subheader>
          {isEnglish ? (
            <>
              This is a service that plots rating changes using only the results
              of a virtual contest in Codeforces.
              <br />
              You can increase the rating at your own pace and at your own time.
            </>
          ) : (
            <>
              Codeforces
              Virtualコンテストの結果のみを用いてレート変動をプロットするサービスです．
              <br />
              自分のペースで好きな時間にレートを上げていくことができます．
            </>
          )}
        </Header.Subheader>
      </Header>
      <Header as="h3">How to use</Header>
      <List ordered={true}>
        <List.Item>
          {isEnglish ? (
            <>
              Register with{' '}
              <a href="https://codeforces.com" target="blank">
                Codeforces
              </a>
            </>
          ) : (
            <>
              <a href="https://codeforces.com" target="blank">
                Codeforces
              </a>
              のアカウントが必要です
            </>
          )}
        </List.Item>
        <List.Item>
          {isEnglish ? (
            <>Login to this service with your Google/Github account</>
          ) : (
            <>Google/Githubアカウントでこのサービスにログイン</>
          )}
        </List.Item>
        <List.Item>
          {isEnglish ? (
            <>Create user by specifying your user name in Codeforces</>
          ) : (
            <>Codeforcesのユーザー名を指定してユーザー登録</>
          )}
        </List.Item>

        <List.Item>
          {isEnglish ? (
            <>
              Enter a{' '}
              <a href="https://codeforces.com" target="blank">
                Codeforces
              </a>{' '}
              virtual contest.
            </>
          ) : (
            <>
              <a href="https://codeforces.com" target="blank">
                Codeforces
              </a>
              上でVirtual Contestに参加
            </>
          )}
        </List.Item>
        <List.Item>
          {isEnglish ? (
            <>Update your rating on this service's profile page</>
          ) : (
            <>このサービスのプロフィールページでレート更新</>
          )}
        </List.Item>
      </List>
      {(() => {
        if (account.id) {
          return (
            <Button
              content="Go to profile"
              basic={true}
              color="green"
              onClick={() => {
                history.push(`/users/${account.id}`);
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
          {isEnglish ? <>Note</> : <>注意点</>}
        </Header>
        <List bulleted={true}>
          <List.Item>
            {isEnglish ? (
              <>
                Contests held before June 2016 are not rated because they use a
                different rating algorithm from the one currently in use
              </>
            ) : (
              <>
                レート計算の仕組みが異なるため，2016/6以前に開催されたコンテストは無効です
              </>
            )}
          </List.Item>
          <List.Item>
            {isEnglish ? (
              <>
                Rating will be updated automatically when you visit your profile
                page
              </>
            ) : (
              <>
                レート更新はプロフィールページにアクセスした際に自動的に行われます
              </>
            )}
          </List.Item>
          <List.Item>
            {isEnglish ? (
              <>It takes about 30 seconds to update rating per contests</>
            ) : (
              <>
                レート更新処理では，1コンテストあたり30秒前後の計算時間が発生します
              </>
            )}
          </List.Item>
          <List.Item>
            {isEnglish ? (
              <>
                Virtual contests that you joined before creating user in this
                service is not rated.
              </>
            ) : (
              <>
                このサービスでユーザー登録するよりも前に参加したVirtual
                Contestの結果は無効です
              </>
            )}
          </List.Item>
          <List.Item>
            {isEnglish ? (
              <>
                To be ranked, you have to join at least one virtual contest and
                update your rating
              </>
            ) : (
              <>
                ランキングに掲載されるには，Virtual
                Contestの結果を1つ以上反映させる必要があります
              </>
            )}
          </List.Item>
        </List>
        <Header as="h5">
          {isEnglish ? (
            <>
              Supported contests are <Link to="contests">HERE</Link>!
            </>
          ) : (
            <>
              対応中のコンテスト一覧は<Link to="contests">こちら</Link>！
            </>
          )}
        </Header>
      </Segment>
    </>
  );
};

export default StartPage;
