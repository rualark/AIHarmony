import {launchAnalysis} from "./analysisLauncher.js";
import {data2plain} from "../state/state.js";

export function analyse() {
  /*
  let lst = [];
  for (let i=0; i<200000; ++i) lst.push(i);
  let tar = new Uint32Array(200000);
  for (let i=0; i<200000; ++i) tar[i] = i;
  let st = '';
  for (let i=0; i<20000; ++i) st += '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789';
  */
  launchAnalysis('CA3', '__Z7analysePhi', data2plain());
}
