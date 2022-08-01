/// <reference types="dragula" />
import * as dragula from "dragula";
import * as MessageFormat from "messageformat";
// import * as Messages from "messageformat/messages";
import { ExampleClass } from './example-decorator';

const document = {};

console.log('Issue 1: dragula')
try {
  const options: dragula.DragulaOptions = {
    revertOnSpill: true,
    isContainer: (el): boolean => false,
    direction: "vertical",
  };
  dragula(options);
} catch (e) {
  console.log("Issue 1: failed to resolve dragula");
}

console.log('Issue 2: MessageFormat')
try {
  const mf = new MessageFormat("en-US");
} catch (e) {
  console.log(
    "Issue 2: failed to resolve MessageFormat as a class with a constructor"
  );
}

// Issue 3: warnings with Angular typescript decorators:
console.log('Issue 3: Reflect')
new ExampleClass('Hello World');
