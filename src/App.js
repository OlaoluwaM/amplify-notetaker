import { AmplifyGreetings, withAuthenticator } from '@aws-amplify/ui-react';
import { API, Auth, graphqlOperation } from 'aws-amplify';
import React from 'react';
import { createNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import styles from './styles/index.module.scss';

function App() {
  const [notes, setNotes] = React.useState([]);
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const data = await API.graphql(graphqlOperation(listNotes));
        const initialNotes = data.data.listNotes.items;
        setNotes(initialNotes);
      } catch {
        console.log('There was an error fetching the initial notes');
      }
    })();
  }, []);
  const addNote = async e => {
    e.preventDefault();
    const input = {
      note: inputValue,
    };
    try {
      // The graphql method on the API module helps us create execute a graphql operation
      const data = await API.graphql(graphqlOperation(createNote, { input }));
      const newNote = data.data.createNote;
      setNotes(notes => [newNote, ...notes]);
    } catch {
      console.error('There was an error');
    }
    setInputValue('');
  };

  return (
    <div className={styles['top-level-container']}>
      <AmplifyGreetings username={Auth?.user.username}></AmplifyGreetings>
      <h1 className={styles.code}>Amplify Notetaker</h1>
      <form onSubmit={addNote} className={styles['note-form']}>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className={styles.pa2F4}
          placeholder="Write your note"
        />
        <button className={styles.pa2F4} type="submit">
          Add note
        </button>
      </form>
      <ul style={{ padding: 0 }}>
        {notes.map(({ id, note }) => (
          <li className={styles.note} key={id}>
            <p>{note}</p>
            <button>
              <span>&times;</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
