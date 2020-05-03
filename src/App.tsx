import React from 'react';
import { Provider } from 'react-redux';
import { Route, Router } from 'react-router';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import Contact from './components/Contact';
import PageWrapper from './components/PageWrapper';
import ProfilePage from './components/ProfilePage';
import StartPage from './components/StartPage';
import UpdateProfilePage from './components/UpdateProfilePage';
import history from './history';
import rootReducer from './reducers';
import ContestsPage from './components/ContestsPage';

const store = createStore(rootReducer, applyMiddleware(thunk));

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PageWrapper>
        <Router history={history}>
          <Route exact={true} path="/contests" component={ContestsPage} />
          <Route exact={true} path="/profile" component={ProfilePage} />
          <Route
            exact={true}
            path="/profile/update"
            component={UpdateProfilePage}
          />
          <Route exact={true} path="/contact" component={Contact} />
          <Route exact={true} path="/" component={StartPage} />
        </Router>
      </PageWrapper>
    </Provider>
  );
};

export default App;
