import React, { useState, useEffect } from "react";
import { withAuthenticator } from "aws-amplify-react";
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote
} from "./graphql/subscriptions";

const App = () => {
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    getNotes();
    const createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes = notes.filter(note => note.id !== newNote.id);
        setNotes([...prevNotes, newNote]);
        setNote("");
      }
    });
    const deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote;
        const updatedNotes = notes.filter(note => note.id !== deletedNote.id);
        setNotes(updatedNotes);
      }
    });
    const updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote;
        const index = notes.findIndex(note => note.id === updatedNote.id);
        setNotes([
          ...notes.slice(0, index),
          updatedNote,
          ...notes.slice(index + 1)
        ]);
        setNote("");
        setId("");
      }
    });
    return () => {
      createNoteListener.unsubscribe();
      deleteNoteListener.unsubscribe();
      updateNoteListener.unsubscribe();
    };
  }, []);

  const getNotes = () =>
    API.graphql(graphqlOperation(listNotes)).then(res =>
      setNotes(res.data.listNotes.items)
    );

  const handleChangeNote = event => setNote(event.target.value);

  const hasExistingNote = () =>
    id ? notes.findIndex(note => note.id === id) > -1 : false;

  const handleAddNote = event => {
    event.preventDefault();
    //check if existing note, if so update it
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      API.graphql(
        graphqlOperation(createNote, {
          input: {
            note
          }
        })
      );
    }
  };

  const handleUpdateNote = () =>
    API.graphql(
      graphqlOperation(updateNote, {
        input: {
          id,
          note
        }
      })
    );

  const handleDeleteNote = id =>
    API.graphql(
      graphqlOperation(deleteNote, {
        input: {
          id
        }
      })
    );

  const handleSetNote = ({ note, id }) => {
    setNote(note);
    setId(id);
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code h2-1"> Amplify Notetaker </h1> {/* Note Form */}{" "}
      <form action="" className="mb3" onSubmit={handleAddNote}>
        <input
          type="text"
          className="pa2 f4"
          placeholder="Write your note"
          onChange={handleChangeNote}
          value={note}
        />
        <button className="pa2 f4" type="submit">
          Add Note
        </button>
      </form>
      {/* Notes List */}
      <div>
        {notes.map(note => (
          <div key={note.id} className="flex items-center">
            <li className="list pa1 f3" onClick={() => handleSetNote(note)}>
              {note.note}{" "}
            </li>{" "}
            <button
              className="bg-transparent bn f4"
              onClick={() => handleDeleteNote(note.id)}
            >
              <span> &times; </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
// export default withAuthenticator(App, {
//   includeGreetings: true
// });
