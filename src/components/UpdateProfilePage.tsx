import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router';
import { Button, Dimmer, Form, Header, Loader, Modal } from 'semantic-ui-react';
import { updateProfile } from '../actions';
import { fetchRealRating } from '../api/fetchRealRating';
import { useAccountInfo, useProfile } from '../hooks';
import getRatingColorStyle from '../utils/getRatingColorStyle';

const UpdateProfilePage: React.FC = () => {
  const history = useHistory();
  const queryParams = new URLSearchParams(useLocation().search);

  const dispatch = useDispatch();
  const account = useAccountInfo();
  const profile = useProfile();
  const [handle, setHandle] = useState('');
  const [extendRating, setExtendRating] = useState(true);
  const [rating, setRating] = useState(1500);
  const [modalOpen, setModalOpen] = useState(false);
  const [handleValidity, setHandleValidity] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);

  useEffect(() => {
    if (queryParams.get('lang')) {
      setIsEnglish(queryParams.get('lang') === 'en');
    }
  }, []);

  const onButtonClick = useCallback(async () => {
    setIsLoading(true);
    const realRating = await fetchRealRating(handle);
    setIsLoading(false);
    if (realRating === -1) {
      setHandleValidity(false);
      return;
    }
    setHandleValidity(true);
    if (extendRating) {
      setRating(realRating);
    } else {
      setRating(1500);
    }
    setModalOpen(true);
  }, [handle, extendRating]);

  const onModalButtonClick = useCallback(() => {
    const time = Math.floor(new Date().getTime() / 1000);
    const userProfile = {
      handle,
      lastUpdateTime: time,
      rating,
      records: [
        {
          contestID: 0,
          contestName: 'Registration',
          oldRating: 0,
          newRating: rating,
          rank: 1,
          startTime: time,
        },
      ],
      registrationTime: time,
    };
    dispatch(
      updateProfile(
        account.id,
        userProfile,
        () => {
          // setIsLoading(true);
        },
        () => {
          history.push(`/users/${account.id}`);
        },
        () => {} // setIsLoading(false)
      )
    );
  }, [account, dispatch, handle, rating, history]);

  if (!account.id) {
    return null;
  }

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
      <Header
        as="h2"
        content="Update Profile"
        subheader={
          isEnglish
            ? 'Specify your user name in Codeforces'
            : '使用するCodeforcesのハンドルを設定します．'
        }
      />
      <Form>
        <Form.Input
          fluid={true}
          error={
            handleValidity
              ? false
              : { content: 'Invalid user name!', pointing: 'above' }
          }
          label="Handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <Form.Checkbox
          label={
            isEnglish
              ? 'I take over official rating in Codeforces'
              : '本来のレートを引き継ぐ'
          }
          checked={extendRating}
          onClick={(e) => setExtendRating(!extendRating)}
        />
        <Loader active={isLoading} />
        <Form.Button color="green" onClick={() => onButtonClick()}>
          OK
        </Form.Button>
        <Form.Button
          color="red"
          onClick={() => {
            if (profile.handle) {
              history.push(`/users/${account.id}`);
            } else {
              history.push('/');
            }
          }}
        >
          Cancel
        </Form.Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Modal.Header
            content={
              isEnglish
                ? 'Create user with the following information'
                : '以下の内容で登録'
            }
          />
          <Modal.Content>
            <Header as="h3" dividing={true}>
              Handle
            </Header>
            <Header as="h4" style={getRatingColorStyle(rating)}>
              {handle}
            </Header>
            <Header as="h3" dividing={true}>
              Rating
            </Header>
            <Header as="h4" style={getRatingColorStyle(rating)}>
              {rating}
            </Header>
          </Modal.Content>
          <Modal.Actions>
            <Header as="h5" color="red" floated="left">
              {isEnglish
                ? '! All your records in this service will be deleted!'
                : '！このサービスにおけるこれまでの参加履歴は削除されます'}
            </Header>
            <Button color="green" onClick={onModalButtonClick}>
              OK
            </Button>
            <Button color="red" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </Modal.Actions>
        </Modal>
        <Dimmer active={isLoading} inverted={true}>
          <Loader active={true} inline="centered" />
        </Dimmer>
      </Form>
    </>
  );
};

export default UpdateProfilePage;
