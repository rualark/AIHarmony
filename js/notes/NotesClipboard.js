import {nd, NotesData} from "./NotesData.js";
import { state2storage } from "../state/state.js";
import { json_stringify_circular } from "../core/string.js";

export class NotesClipboard {
  constructor() {
    this.clear();
  }

  clear() {
    this.voices = [];
    this.source = {};
    this.mode = 'standby';
  }

  copy(v1, v2, s1, s2) {
    // Check if selection is backwards (this can happen if it is analysis selection)
    if (v1 > v2 || s1 > s2) return false;
    this.clear();
    this.source = {
      v1: v1,
      v2: v2,
      s1: s1,
      s2: s2
    };
    for (let v=v1; v<=v2; ++v) {
      const vc = nd.voices[v];
      const n1 = nd.getClosestNote(v, s1);
      let fragment = {
        notes: []
      };
      for (let n = n1; n < vc.notes.length; ++n) {
        let nt = vc.notes[n];
        if (nt.step > s2) {
          break;
        }
        // Check if selection is not rectangular (this can happen if it is analysis selection)
        if (nt.step < s1 || nt.step + nt.len - 1 > s2) {
          this.clear();
          return false;
        }
        let nt_copy = JSON.parse(json_stringify_circular(nt));
        if (nt.step + nt.len > s2) {
          nt_copy.startsTie = false;
        }
        fragment.notes.push(nt_copy);
      }
      this.voices.push(fragment);
    }
    return true;
  }

  paste(v1, n) {
    if (!this.voices) return "Clipboard is empty";
    const mlen = nd.timesig.measure_len;
    const v2 = v1 + this.voices.length - 1;
    // Add voices if needed
    let voices_added = 0;
    while (v2 >= nd.voices.length) {
      nd.add_voice(nd.voices.length);
      ++voices_added;
    }
    if (voices_added) nd.update_note_steps();
    // Target steps: first and last (not next after last)
    const s1 = nd.voices[v1].notes[n].step;
    const s2 = s1 + (this.source.s2 - this.source.s1);
    // Last note in first voice
    const last_note = nd.voices[0].notes[nd.voices[0].notes.length - 1];
    const last_note_end = last_note.step + last_note.len - 1;
    // Append measures if needed to all voices
    const new_measures = Math.ceil((s2 - last_note_end) / mlen);
    console.log('Paste: ', new_measures, this.voices, this.source);
    if (new_measures > 0) {
      for (let i=0; i<new_measures; ++i) {
        nd.append_measure(false);
      }
      nd.update_note_steps();
    }
    for (let v=v1; v<=v2; ++v) {
      const vc = nd.voices[v];
      const notes = vc.notes;
      let n1 = nd.getClosestNote(v, s1);
      const n2 = nd.getClosestNote(v, s2);
      console.log(`Paste v${v} s1:${s1} s2:${s2} n1.step:${notes[n1].step} n1.len:${notes[n1].len} n2.step:${notes[n2].step} n2.len:${notes[n2].len}`);
      // Calculate left_rest before cutting (because first and last note can be the same)
      const left_rest = notes[n2].step + notes[n2].len - 1 - s2;
      // Cut previous note by selection border and do not delete it
      if (notes[n1].step < s1) {
        notes[n1].len = s1 - notes[n1].step;
        ++n1;
      }
      let new_notes = JSON.parse(json_stringify_circular(this.voices[v - v1].notes));
      console.log(`Paste v${v} left_rest:${left_rest}`, json_stringify_circular(new_notes));
      if (left_rest) {
        new_notes.push(...NotesData.make_rests(left_rest));
      }
      console.log(`Paste v${v}`, json_stringify_circular(new_notes))
      // Split notes by measure borders
      let s = s1;
      for (let i=0; i<new_notes.length; ++i) {
        const len = new_notes[i].len;
        // Calculate new note starts
        new_notes[i].step = s;
        if (Math.floor(s / mlen) < Math.floor((s + new_notes[i].len - 1) / mlen)) {
          // First split notes by measures into notes-in-measure
          console.log('Note', json_stringify_circular(new_notes[i]), i);
          const measured_notes = nd.split_note_into_measures(new_notes[i]);
          let splitted_notes = [];
          for (const measured_note of measured_notes) {
            // Split every note-in-measure by allowed note length and insert them
            splitted_notes.push(
              ...NotesData.split_note(measured_note)
            );
          }
          // Replace with splitted notes at once to preserve order
          new_notes.splice(i, 1, ...splitted_notes);
          // Skip splitted notes to prevent splitting them again
          i += splitted_notes.length - 1;
        }
        s += len;
        console.log(`Paste v${v} s:${s}`, json_stringify_circular(new_notes));
      }
      console.log(`Paste v${v} n1:${n1} n2:${n2}`, json_stringify_circular(new_notes));
      // Remove old notes and add new
      notes.splice(
        n1,
        n2 - n1 + 1,
        ...new_notes,
      );
    }
  }
};

export let nclip = new NotesClipboard();
