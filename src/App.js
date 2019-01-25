import React, { Component } from "react";
import { withAuthenticator } from "aws-amplify-react";
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote
} from "./graphql/subscriptions";

class App extends Component {
  state = {
    note: "",
    id: "",
    notes: [
      {
        id: 1,
        note: "Hello world"
      }
    ]
  };

  componentDidMount() {
    this.getNotes();
    this.createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes = this.state.notes.filter(
          note => note.id !== newNote.id
        );
        this.setState({ notes: [...prevNotes, newNote] });
      }
    });
    this.deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote;
        const updatedNotes = this.state.notes.filter(
          note => note.id !== deletedNote.id
        );
        this.setState({ notes: updatedNotes });
      }
    });
    this.updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: noteData => {
        const { notes } = this.state;
        const updatedNote = noteData.value.data.onUpdateNote;
        const index = notes.findIndex(note => note.id === updatedNote.id);
        this.setState({
          notes: [
            ...notes.slice(0, index),
            updatedNote,
            ...notes.slice(index + 1)
          ],
          note: "",
          id: ""
        });
      }
    });
  }

  componentWillUnmount() {
    this.createNoteListener.unsubscribe();
    this.deleteNoteListener.unsubscribe();
    this.updateNoteListener.unsubscribe();
  }

  getNotes = () =>
    API.graphql(graphqlOperation(listNotes)).then(res =>
      this.setState({
        notes: res.data.listNotes.items
      })
    );

  handleChangeNote = event => this.setState({ note: event.target.value });

  hasExistingNote = () =>
    this.state.id
      ? this.state.notes.findIndex(note => note.id === this.state.id) > -1
      : false;

  handleAddNote = async event => {
    const { note } = this.state;
    event.preventDefault();
    //check if existing note, if so update it
    if (this.hasExistingNote()) {
      this.handleUpdateNote();
    } else {
      await API.graphql(graphqlOperation(createNote, { input: { note } }));
      this.setState({ note: "" });
    }
  };

  handleUpdateNote = () =>
    API.graphql(
      graphqlOperation(updateNote, {
        input: { id: this.state.id, note: this.state.note }
      })
    );

  handleDeleteNote = id =>
    API.graphql(
      graphqlOperation(deleteNote, {
        input: {
          id
        }
      })
    );

  handleSetNote = ({ note, id }) => this.setState({ note, id });

  render() {
    const { notes, note } = this.state;
    return (
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code h2-1">Amplify Notetaker </h1>
        {/* Note Form */}
        <form action="" className="mb3" onSubmit={this.handleAddNote}>
          <input
            type="text"
            className="pa2 f4"
            placeholder="Write your note"
            onChange={this.handleChangeNote}
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
              <li
                className="list pa1 f3"
                onClick={() => this.handleSetNote(note)}
              >
                {note.note}
              </li>
              <button
                className="bg-transparent bn f4"
                onClick={() => this.handleDeleteNote(note.id)}
              >
                <span>&times;</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: true });
