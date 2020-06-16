import { AmplifyGreetings, withAuthenticator } from '@aws-amplify/ui-react';
import { API, Auth, graphqlOperation } from 'aws-amplify';
import React from 'react';
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import { onCreateNote, onDeleteNote, onUpdateNote } from './graphql/subscriptions';
import styles from './styles/index.module.scss';

function App() {
  const subscriptionsRef = React.useRef({});
  const [notes, setNotes] = React.useState([]);
  const [inputValue, setInputValue] = React.useState('');
  const [updatingNote, setUpdatingNote] = React.useState(false);

  React.useEffect(() => {
    const subscriptions = subscriptionsRef.current;
    getNotes();

    subscriptions.create = API.graphql(
      graphqlOperation(onCreateNote, { owner: Auth.user.username })
    ).subscribe({
      next: noteData => {
        console.log('Using onCreateNote subscription');
        const newNote = noteData.value.data.onCreateNote;
        setNotes(displayedNotes => [...displayedNotes, newNote]);
      },
    });

    subscriptions.delete = API.graphql(
      graphqlOperation(onDeleteNote, { owner: Auth.user.username })
    ).subscribe({
      next: noteData => {
        console.log('Using onDeleteNote subscription');
        const { id } = noteData.value.data.onDeleteNote;
        setNotes(displayedNotes => displayedNotes.filter(({ id: Id }) => id !== Id));
      },
    });

    subscriptions.update = API.graphql(
      graphqlOperation(onUpdateNote, { owner: Auth.user.username })
    ).subscribe({
      next: noteData => {
        console.log('Using onUpdateNote subscription');
        const newNote = noteData.value.data.onUpdateNote;
        setNotes(displayedNotes => {
          const noteIndex = displayedNotes.findIndex(({ id: Id }) => newNote.id === Id);
          console.count('Updated onUpdateNote');
          displayedNotes[noteIndex] = newNote;
          setUpdatingNote(false);
          return displayedNotes;
        });
      },
    });

    return () => {
      Object.keys(subscriptions).forEach(sub => subscriptions[sub].unsubscribe());
    };
  }, []);

  async function getNotes() {
    try {
      const data = await API.graphql(graphqlOperation(listNotes));
      setNotes(data.data.listNotes.items);
    } catch (err) {
      console.log(`There was an error fetching the initial notes. ${JSON.stringify(err)}`);
      throw err;
    }
  }

  const handleDeleteNote = async id => {
    try {
      await API.graphql(graphqlOperation(deleteNote, { input: { id } }));
    } catch (err) {
      console.error(`There was an error deleting this note ${JSON.stringify(err)}`);
      throw err;
    }
  };

  const finalizeNoteUpdate = async e => {
    const input = {
      id: updatingNote,
      note: inputValue,
    };
    try {
      await API.graphql(graphqlOperation(updateNote, { input }));
    } catch (err) {
      console.error(`There was an error updating this note. ${err}`);
      throw err;
    } finally {
      setInputValue('');
    }
  };

  const addNote = async e => {
    e.preventDefault();
    if (updatingNote) return finalizeNoteUpdate(e);
    const input = {
      note: inputValue,
    };
    try {
      await API.graphql(graphqlOperation(createNote, { input }));
    } catch (err) {
      console.error(`There was an error, adding the note to the database. ${JSON.stringify(err)}`);
      throw err;
    } finally {
      setInputValue('');
    }
  };

  const handleUpdateNote = (e, id, note) => {
    if (!e.target.matches('p')) return;
    setUpdatingNote(id);
    setInputValue(note);
  };

  return (
    <>
      <AmplifyGreetings username={Auth?.user.username}></AmplifyGreetings>
      <div className={styles['top-level-container']}>
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
            {updatingNote ? 'Save changes' : 'Add note'}
          </button>
        </form>
        <ul style={{ padding: 0 }}>
          {notes.map(({ id, note }) => (
            <li onClick={e => handleUpdateNote(e, id, note)} className={styles.note} key={id}>
              <p>{updatingNote === id ? inputValue : note}</p>
              <button onClick={() => handleDeleteNote(id)}>
                <span>&times;</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default withAuthenticator(App);
