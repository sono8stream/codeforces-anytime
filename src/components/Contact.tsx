import React from 'react';
import { Header } from 'semantic-ui-react';

const Contact = () => {
  return (
    <>
      <Header
        as="h2"
        content="Contact Me"
        subheader="ご意見お待ちしております"
      />
      <Header textAlign="left" as="h3" content="E-mail" />
      <p>sono888.gamestudio＠gmail.com(＠→@)</p>
      <Header as="h3" content="Twitter" />
      <p>
        <a href="https://twitter.com/_sono_8_">@_sono_8_</a>
      </p>
      <Header as="h3">
        <a href="https://github.com/sono8stream/codeforces-anytime">Github repository</a>
      </Header>
    </>
  );
};

export default Contact;
