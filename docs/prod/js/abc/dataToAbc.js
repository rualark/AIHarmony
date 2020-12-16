import {clefs} from "../ui/modal/clefs.js";
import {nd} from "../notes/NotesData.js";
import {alter2abc, d2abc} from "../notes/noteHelper.js";
import {ares} from "../analysis/AnalysisResults.js";
import { settings } from "../state/settings.js";

export function dataToAbc(instrument) {
  nd.styles = [];
  let mlen = nd.timesig.measure_len;
  let abc = '';
  abc += '%%barnumbers 1\n';
  abc += '%%printtempo 0\n';
  $('#tempo').html(`Tempo: ♩=${nd.tempo}`);
  abc += `Q:1/4=${nd.tempo}\n`;
  abc += 'M:' + nd.timesig.beats_per_measure + '/' + nd.timesig.beat_type + '\n';
  abc += 'K:' + nd.keysig.name + '\n';
  abc += 'L:1/16\n';
  for (let v=0; v<nd.voices.length; ++v) {
    let vc = nd.voices[v];
    let name = vc.name;
    if (nd.algo === 'CA3') {
      let vocra = ares.getVocra(v);
      let spec = ares.getSpecies(v);
      if (vocra != null && vc.name.slice(0, 3).toLowerCase() !== vocra.slice(0, 3).toLowerCase()) name += `\\n[${vocra}]`;
      if (spec != null && ares.av_cnt > 1) {
        if (spec === 0) {
          name += `\\n(c.f.)`;
        }
        else {
          name += `\\n(sp. ${spec})`;
        }
      }
      if (instrument) name = name.replace(/\\n/g, ' ');
    }
    if (instrument) name = instrument + '# ' + name;
    abc += `V: V${v} clef=${vc.clef} name="${name}"\n`;
  }
  for (let v=0; v<nd.voices.length; ++v) {
    let vc = nd.voices[v];
    abc += `[V: V${v}]`;
    if (instrument) abc += `!mp!`;
    let s = 0;
    let old_m = 0;
    let altmap = {};
    let prev_altmap = {};
    let end_shape = {};
    let note_in_measure = 0;
    for (let n=0; n<vc.notes.length; ++n) {
      let m = Math.floor(s / mlen);
      ++note_in_measure;
      if (s % mlen == 0) note_in_measure = 0;
      if (m != old_m) {
        old_m = m;
        prev_altmap = altmap;
        altmap = {};
      }
      let nt = vc.notes[n];
      let flags = ares.getFlagsInInterval(v, s, s + nt.len);
      nd.abc_charStarts[abc.length] = {voice: v, note: n};
      nt.abc_charStarts = abc.length;

      if (nt.d && settings.show_nht && nd.algo === 'CA3') {
        const msh = ares.getMsh(v, s);
        if (msh < 0) abc += `"^ø"`;
      }
      if (flags.red > 0) abc += '"^🚩"';
      else if (flags.yellow > 0) abc += '"^⚠️"';
      if (ares.harm != null && s in ares.harm && ares.vid != null && v === ares.vid[0] && settings.show_harmony) {
        let harm_st = '';
        for (let s2 = 0; s2 < nt.len; ++s2) {
          if (!((s + s2) in ares.harm)) continue;
          if (harm_st !== '') {
            harm_st += ', ';
          }
          harm_st += ares.harm[s + s2];
        }
        abc += `"_${harm_st}"`;
      }
      if (settings.show_text && nt.text) {
        let ta = nt.text.split('\n');
        for (const text of ta) {
          abc += `"^${text}"`;
        }
      }
      if (settings.show_lyrics && nt.lyric) {
        let la = nt.lyric.split('\n');
        for (const lyric of la) {
          abc += `"_${lyric}"`;
        }
      }

      if (flags.red_slur > 0) {
        abc += '.(';
        end_shape[n + 1] = ')';
        nd.styles.push({
          style: `.abcjs-slur.abcjs-dotted.abcjs-start-m${m}-n${note_in_measure}.abcjs-v${v}`,
          stroke: 'red'
        });
      }
      else if (flags.yellow_slur > 0) {
        abc += '.(';
        end_shape[n + 1] = ')';
        nd.styles.push({
          style: `.abcjs-slur.abcjs-dotted.abcjs-start-m${m}-n${note_in_measure}.abcjs-v${v}`,
          stroke: 'orange'
        });
      }

      let d = nt.d;
      let dc = nt.d % 7;
      if (d) {
        let show_alter = nt.alter;
        if (nt.alter == 10) {
          if (!(d in altmap)) {
            // First unaltered
            if (d in prev_altmap && prev_altmap[d] != nt.alter && prev_altmap[d] != nd.keysig.imprint[dc]) {
              // First unaltered after alter in previous measure
              show_alter = nd.keysig.imprint[dc];
            }
          } else if (nt.alter != altmap[d]) {
            // Changed to unaltered
            show_alter = nd.keysig.imprint[dc];
          }
        } else {
          if (d in altmap && nt.alter == altmap[d]) {
            // Same altered
            show_alter = 10;
          }
          if (n && vc.notes[n - 1].startsTie && vc.notes[n - 1].d && nt.d) {
            // Hide alteration after tie
            show_alter = 10;
          }
        }
        altmap[d] = nt.alter;
        let abc_note = d2abc(d - clefs[vc.clef].transpose);
        abc += alter2abc(show_alter) + abc_note + nt.len;
      } else {
        abc += 'z' + nt.len;
      }
      s += nt.len;
      if (nt.startsTie && n < vc.notes.length - 1 && vc.notes[n + 1].d) {
        abc += '-';
      }
      if (end_shape[n]) {
        abc += end_shape[n];
        end_shape[n] = '';
      }
      nt.abc_charEnds = abc.length;
      if (s % nd.timesig.measure_len === 0) {
        abc += '|';
      }
    }
    abc += '\n';
  }
  return abc;
}
