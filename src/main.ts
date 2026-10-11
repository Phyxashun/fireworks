// FILE-PATH: src/main.ts

import { Bootstrap } from './app/Bootstrap';

console.clear();

const bootstrap: Bootstrap = new Bootstrap();
const app = bootstrap.create();

app.start();
