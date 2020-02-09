let workerState = {
  state: 'init'
};

var Module = {
  locateFile: function(s) {
    return 'modules/' + s;
  },
};

function waitForVar(obj, field, vals, pause, timeout) {
  return new Promise((resolve, reject) => {
    (function waitForVarInternal(time = 0) {
      if (vals.includes(obj[field])) {
        return resolve(time);
      }
      if (time > timeout) {
        return reject(`Timeout ${timeout} ms waiting for ${field}=${vals.join(',')}`);
      }
      setTimeout(() => {
        waitForVarInternal(time + pause);
      }, pause);
    })();
  });
}

async function initWasmModule(modName) {
  workerState.state = 'loading js';
  importScripts('wasmArray.js');
  importScripts('modules/' + modName + '.js');
  if (Module == null) {
    throw 'Error loading worker js module';
  }
  workerState.state = 'loading wasm';
  Module.onRuntimeInitialized = function() {
    // Will be called before main()
    workerState.state = 'ready';
  };
  await waitForVar(workerState, 'state', ['ready'], 50, 4000);
  // Here main() will usually be finished
}

function toInt32Arr(arr) {
  const res = new Int32Array(arr.length);
  for (let i=0; i < arr.length; i++)
    res[i] = arr[i];
  return res;
}

function toFloat32Arr(arr) {
  const res = new Float32Array(arr.length);
  for (let i=0; i < arr.length; i++)
    res[i] = arr[i];
  return res;
}

function transferToHeap(wasmMod, arr) {
  const fixedArray = toFloat32Arr(arr);
  let heapSpace = wasmMod._malloc(fixedArray.length * fixedArray.BYTES_PER_ELEMENT);
  wasmMod.HEAPF32.set(fixedArray, heapSpace >> 2);
  return heapSpace;
}

function callWasmFuncArray(wasmMod, funcName, arr) {
  let arrayOnHeap;
  try {
    arrayOnHeap = transferToHeap(wasmMod, arr);
    console.log(arrayOnHeap, arr.length);
    return wasmMod[funcName](arrayOnHeap, arr.length);
  }
  finally {
    wasmMod._free(arrayOnHeap);
  }
}

function callWasmFuncArrayToArray(wasmMod, funcName, arr) {
  let res = callWasmFuncArray(wasmMod, funcName, arr);
  let array = [];
  let n = wasmMod.HEAPF32[res / Float32Array.BYTES_PER_ELEMENT];
  for (let i=0; i<n; i++) {
    array.push(wasmMod.HEAPF32[res / Float32Array.BYTES_PER_ELEMENT + i + 1]);
  }
  return array;
}

function message(type, modName, funcName, data) {
  self.postMessage({
    type: type,
    modName: modName,
    funcName: funcName,
    data: data,
  });
}

// Handle incoming messages
self.addEventListener('message', async function(event) {
  const { type, modName, funcName, data } = event.data;
  if (type === "CALL") {
    //console.log('Analyse2');
    try {
      if (workerState.state === 'init') {
        console.log('initWasmModule0', workerState.state);
        await initWasmModule(modName);
      }
      const res = ccallArrays(funcName, "string", ["string"], [data], {
        heapIn: "HEAPU8",
        heapOut: "HEAPU8"
      });
      //let res = callWasmFuncArrayToArray(Module, funcName, data);
      //console.log('Analyse3');
      message("RESULT", modName, funcName, res);
    }
    catch (e) {
      message("ERROR", modName, funcName, e);
    }
  }
}, false);
