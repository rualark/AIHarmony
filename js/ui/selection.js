import {async_redraw, selected} from "../abc/abchelper.js";
import {showClefsModal} from "./modal/clefs.js";
import {nd} from "../notes/NotesData.js";
import {showTimesigModal} from "./modal/timesig.js";
import {showKeysigModal} from "./modal/keysig.js";
import {
  can_increment_note,
  future,
  increment_note,
  is_locked
} from "./edit/editNote.js";
import {saveState} from "../state/history.js";
import {button_enabled, button_enabled_active, button_active} from "./lib/uilib.js";
import {rename_part, stop_advancing} from "./edit/editScore.js";
import {can_pre_tie, can_tie, is_pre_tie} from "./edit/editTie.js";
import {can_dot, can_len} from "./edit/editLen.js";
import {ares} from "../analysis/AnalysisResults.js";
import {trackEvent} from "../integration/tracking.js";
import { showTempoModal } from "./modal/tempoModal.js";
import { nclip } from "../notes/NotesClipboard.js";
import { select_from_to } from "./edit/editSelection.js";
import { play_note } from "../audio/audio.js";

function selectionHasMistake() {
  if (selected.note == null) return false;
  if (!(selected.note.voice in ares.stepFlags)) return false;
  let v = selected.note.voice;
  let n = selected.note.note;
  if (v >= nd.voices.length) return false;
  if (n >= nd.voices[v].notes.length) return false;
  let nt = nd.voices[v].notes[n];
  let s = nt.step;
  if (!(s in ares.stepFlags[v])) return false;
  return true;
}

export function update_selection() {
  const locked = is_locked();
  const has_notes = nd.has_notes();
  button_enabled('play', has_notes);
  button_enabled('ais', has_notes);
  button_enabled('transpose',
    selected.element != null && typeof selected.element.abselem !== 'undefined');
  button_enabled('add_bar',
    selected.element != null && typeof selected.element.abselem !== 'undefined');
  button_enabled('del_bar',
    selected.element != null && typeof selected.element.abselem !== 'undefined');
  button_enabled('add_part',
    selected.element != null && typeof selected.element.abselem !== 'undefined' && nd.voices.length < 63);
  button_enabled('del_part',
    selected.element != null && typeof selected.element.abselem !== 'undefined' && nd.voices.length > 1);
  button_enabled_active('note_c',
    selected.element != null && selected.element.duration && !locked,
    selected.element != null && selected.element.pitches && (77 + selected.element.pitches[0].pitch) % 7 === 0);
  button_enabled_active('note_d',
    selected.element != null && selected.element.duration && !locked,
    selected.element != null && selected.element.pitches && (77 + selected.element.pitches[0].pitch) % 7 === 1);
  button_enabled_active('note_e',
    selected.element != null && selected.element.duration && !locked,
    selected.element != null && selected.element.pitches && (77 + selected.element.pitches[0].pitch) % 7 === 2);
  button_enabled_active('note_f',
    selected.element != null && selected.element.duration && !locked,
    selected.element != null && selected.element.pitches && (77 + selected.element.pitches[0].pitch) % 7 === 3);
  button_enabled_active('note_g',
    selected.element != null && selected.element.duration && !locked,
    selected.element != null && selected.element.pitches && (77 + selected.element.pitches[0].pitch) % 7 === 4);
  button_enabled_active('note_a',
    selected.element != null && selected.element.duration && !locked,
    selected.element != null && selected.element.pitches && (77 + selected.element.pitches[0].pitch) % 7 === 5);
  button_enabled_active('note_b',
    selected.element != null && selected.element.duration && !locked,
    selected.element != null && selected.element.pitches && (77 + selected.element.pitches[0].pitch) % 7 === 6);
  button_enabled_active('rest',
    selected.element != null && selected.element.duration && !locked,
    selected.element != null && selected.element.rest && selected.element.rest.type === 'rest');
  button_enabled_active('up8', can_increment_note(7) && !locked, false);
  button_enabled_active('down8', can_increment_note(-7) && !locked, false);
  if (selected.element != null && selected.element.rest && selected.element.rest.type === 'rest' || future.advancing) {
    button_enabled_active('dblflat', selected.element.duration && !locked, future.alteration === -2);
    button_enabled_active('flat', selected.element.duration && !locked, future.alteration === -1);
    button_enabled_active('natural', selected.element.duration && !locked, future.alteration === 0);
    button_enabled_active('sharp', selected.element.duration && !locked, future.alteration === 1);
    button_enabled_active('dblsharp', selected.element.duration && !locked, future.alteration === 2);
  } else {
    button_enabled_active('dblflat',
      selected.element != null && selected.element.duration && !locked,
      selected.element != null && selected.element.pitches && selected.element.pitches[0].accidental === 'dblflat');
    button_enabled_active('flat',
      selected.element != null && selected.element.duration && !locked,
      selected.element != null && selected.element.pitches && selected.element.pitches[0].accidental === 'flat');
    button_enabled_active('natural',
      selected.element != null && selected.element.duration && !locked,
      selected.element != null && selected.element.pitches && selected.element.pitches[0].accidental === 'natural');
    button_enabled_active('sharp',
      selected.element != null && selected.element.duration && !locked,
      selected.element != null && selected.element.pitches && selected.element.pitches[0].accidental === 'sharp');
    button_enabled_active('dblsharp',
      selected.element != null && selected.element.duration && !locked,
      selected.element != null && selected.element.pitches && selected.element.pitches[0].accidental === 'dblsharp');
  }
  //console.log('nl', future.advancing, future.len);
  if (future.advancing && future.len) {
    button_enabled_active('16th', selected.element.duration && !locked, [1].includes(future.len));
    button_enabled_active('8th', can_len(2) && !locked, [2, 3].includes(future.len));
    button_enabled_active('quarter', can_len(4) && !locked, [4, 6].includes(future.len));
    button_enabled_active('half', can_len(8) && !locked, [8, 12].includes(future.len));
    button_enabled_active('whole', can_len(16) && !locked, [16, 24].includes(future.len));
    button_enabled_active('dot', can_dot() && !locked, [3, 6, 12, 24].includes(future.len));
  } else {
    button_enabled_active('16th',
      selected.element != null && selected.element.duration && !locked,
      selected.element != null && [0.0625].includes(selected.element.duration));
    button_enabled_active('8th', can_len(2) && !locked,
      selected.element != null && [0.125, 0.1875].includes(selected.element.duration));
    button_enabled_active('quarter', can_len(4) && !locked,
      selected.element != null && [0.25, 0.375].includes(selected.element.duration));
    button_enabled_active('half', can_len(8) && !locked,
      selected.element != null && [0.5, 0.75].includes(selected.element.duration));
    button_enabled_active('whole', can_len(16) && !locked,
      selected.element != null && [1, 1.5].includes(selected.element.duration));
    button_enabled_active('dot', can_dot() && !locked,
      selected.element != null && [0.375, 0.75, 1.5].includes(selected.element.duration));
  }
  if (future.advancing && future.len) {
    button_enabled_active('tie', can_pre_tie() && !locked, is_pre_tie());
  } else {
    button_enabled_active('tie', can_tie() && !locked,
      selected.element != null && selected.element.abselem && selected.element.abselem.startTie);
  }
  button_enabled('add_lyric', selected.note);
  button_enabled('add_text', selected.note);
  button_enabled('copy', selected.note);
  button_enabled('paste', selected.note);
  button_enabled('repeat', selected.note);
  button_enabled_active('select', selected.note, nclip.mode == 'select');
  button_enabled('anext', ares.pFlag != null); // && ares.pFlagCur < ares.pFlag.length - 1
  button_enabled('aprev', ares.pFlag != null); // && ares.pFlagCur > 0
  button_enabled('mistake', selectionHasMistake());
  if (selected.note != null && selected.note.v1 == null && selected.note.note != null) {
    $('.ares').css({"font-weight": ''});
    $('.ares_' + selected.note.voice + '_' + selected.note.note).css({"font-weight": 'bold'});
  }
}

export function element_click(abcElem, tuneNumber, classes, pos, move, mouseEvent) {
  //console.log('Click', abcElem, tuneNumber, classes, pos, move, mouseEvent);
  if (abcElem['el_type'] !== 'tempo') {
    selected.element = abcElem;
  }
  if (abcElem['el_type'] === 'tempo') {
    showTempoModal();
    selected.note = null;
    nclip.mode = 'standby';
  }
  else if (abcElem['el_type'] === 'voiceName') {
    rename_part(pos.voice);
    selected.note = null;
    nclip.mode = 'standby';
  }
  else if (typeof selected.element.clefPos !== 'undefined') {
    showClefsModal(nd.voices[pos.voice]);
    trackEvent('AiHarmony', 'click_clef');
    selected.note = null;
    nclip.mode = 'standby';
  }
  else if (typeof selected.element.value !== 'undefined') {
    showTimesigModal();
    trackEvent('AiHarmony', 'click_timesig');
    selected.note = null;
    nclip.mode = 'standby';
  }
  else if (typeof selected.element.mode !== 'undefined') {
    showKeysigModal();
    selected.note = null;
    nclip.mode = 'standby';
  }
  if (selected.element && selected.element.duration != null) {
    if (nclip.mode === 'select' || mouseEvent.shiftKey) {
      let el = nd.abc_charStarts[selected.element.startChar];
      if (el) {
        select_from_to(selected.note.voice, el.voice, selected.note.note, el.note);
        nclip.mode = 'standby';
      }
    } else {
      selected.note = nd.abc_charStarts[selected.element.startChar];
      play_note(selected.note.voice, selected.note.note);
    }
  }
  stop_advancing();
  if (move.step) {
    increment_note(-move.step);
    async_redraw();
    trackEvent('AiHarmony', 'note_drag');
    return;
  } else {
    saveState(false);
  }
  update_selection();
}