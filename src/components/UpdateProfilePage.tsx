import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Dimmer, Form, Header, Loader, Modal } from 'semantic-ui-react';
import { updateProfile } from '../actions';
import { fetchRealRating } from '../api/fetchRealRating';
import history from '../history';
import { useAccountInfo, useProfile } from '../hooks';
import getRatingColorStyle from '../utils/getRatingColorStyle';

const UpdateProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const account = useAccountInfo();
  const profile = useProfile();
  const [handle, setHandle] = useState('');
  const [extendRating, setExtendRating] = useState(true);
  const [rating, setRating] = useState(1500);
  const [modalOpen, setModalOpen] = useState(false);
  const [handleValidity, setHandleValidity] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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
          history.push('/profile');
        },
        () => {} // setIsLoading(false)
      )
    );
  }, [account, dispatch, handle, rating]);

  if (!account.id) {
    return null;
  }

  return (
    <div>
      <Header
        as="h2"
        content="Update Profile"
        subheader="使用するCodeforcesのハンドルを設定します．"
      />
      <Form>
        <Form.Input
          fluid={true}
          error={!handleValidity}
          label="Handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <Form.Checkbox
          label="本来のレートを引き継ぐ"
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
              history.push('/profile');
            } else {
              history.push('/');
            }
          }}
        >
          Cancel
        </Form.Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Modal.Header content="以下の内容で登録" />
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
              ！このサービスにおけるこれまでの参加履歴は削除されます
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
    </div>
  );
};

export default UpdateProfilePage;
