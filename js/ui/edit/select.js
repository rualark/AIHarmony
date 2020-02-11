import {async_redraw, selected, highlightNote, state, highlightRange} from "../../abc/abchelper.js";
import {stop_advancing} from "./editScore.js";
import {saveState} from "../../state/history.js";
import {update_selection} from "../notation.js";
import {nd} from "../../notes/NotesData.js";

export function move_to_next_note(saveState = true) {
  if (!selected.element || !selected.element.duration) return;
  let el = nd.abc_charStarts[selected.element.startChar];
  let notes = nd.voices[el.voice].notes;
  if (el.note === notes.length - 1) {
    nd.append_measure(saveState);
    selected.note = {
      voice: selected.note.voice,
      note: selected.note.note + 1
    };
    return true;
  }
  selected.note = {
    voice: selected.note.voice,
    note: selected.note.note + 1
  };
  return false;
}

export function next_note() {
  if (state.state !== 'ready') return;
  if (move_to_next_note(false)) {
    async_redraw();
  } else {
    highlightNote();
  }
  stop_advancing();
  saveState(false);
  update_selection();
}

export function move_to_previous_note() {
  if (!selected.element || !selected.element.duration) return;
  let el = nd.abc_charStarts[selected.element.startChar];
  if (el.note) {
    selected.note = {
      voice: selected.note.voice,
      note: selected.note.note - 1
    };
  }
}

export function prev_note() {
  if (state.state !== 'ready') return;
  move_to_previous_note();
  highlightNote();
  stop_advancing();
  saveState(false);
  update_selection();
}

export function select_note(v, n) {
  if (state.state !== 'ready') return;
  if (nd.voices.length <= v) return;
  if (nd.voices[v].notes.length <= n) return;
  selected.note = {voice: v, note: n};
  highlightNote();
  stop_advancing();
  saveState(false);
  update_selection();
}

export function select_range(v1, v2, s1, s2) {
  if (state.state !== 'ready') return;
  if (nd.voices.length <= v1) return;
  if (nd.voices.length <= v2) return;
  selected.note = {
    voice: v1,
    note: nd.getClosestNote(v1, s1),
    v1: v1,
    n11: nd.getClosestNote(v1, s1),
    n12: nd.getClosestNote(v1, s2),
    v2: v2,
    n21: nd.getClosestNote(v2, s1),
    n22: nd.getClosestNote(v2, s2)
  };
  highlightRange();
  stop_advancing();
  saveState(false);
  update_selection();
}
