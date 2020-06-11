import { AmplifyGreetings, withAuthenticator } from '@aws-amplify/ui-react';
import { Auth } from 'aws-amplify';
import React from 'react';

function App() {
  return (
    <div>
      <AmplifyGreetings username={Auth?.user.username}></AmplifyGreetings>
      App
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
