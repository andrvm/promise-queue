# How to use

### Preparation
```typescript
import Queue from './queue';

const promiseTask = (sec = 1, id: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id === 4) {
        reject(new Error(`Error happened on task ${id}`));
      } else {
        resolve(`Task ${id} is finished`);
      }
    }, sec * 1000);
  });
}
```

### Run
```typescript
const queue = new Queue({
  concurrency: 4,
  pause: true,
  reRunCount: 2,
  debug: true
});

setTimeout(() => {
  queue.resume();
}, 2000);

(async () => {

  const results = await queue.add([
    () => promiseTask(3, 1),
    () => promiseTask(6, 2),
    () => promiseTask(5, 3),
    () => promiseTask(8, 4),
    () => promiseTask(10, 5),
    () => promiseTask(4, 6),
    () => promiseTask(5, 7)
  ]);

  console.log('Results: ', results);

})();
```

```
yarn start
```

### Output
```
Queue is paused
Queue is resumed
Start executing task: 1
Start executing task: 2
Start executing task: 3
Start executing task: 4
Task: 1 is finished
Start executing task: 5
Start executing task: 6
Start executing task: 7
Task: 3 is finished
Task: 2 is finished
Task: 6 is finished
Task: 4 is run again, attempt # 1 
Start executing task: 4
Task: 7 is finished
Task: 5 is finished
Task: 4 is run again, attempt # 2 
Start executing task: 4
Task: 4 is finished
Task: 4 raise an exception
(node:27119) UnhandledPromiseRejectionWarning: Error: Error happened on task 4
    at Timeout._onTimeout (/media/andrvm/SAMSUNG/PROJECTS/tmp/promise-queue/src/index.js:48:24)
    at listOnTimeout (internal/timers.js:554:17)
    at processTimers (internal/timers.js:497:7)
(node:27119) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). To terminate the node process on unhandled promise rejection, use the CLI flag `--unhandled-rejections=strict` (see https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode). (rejection id: 1)
(node:27119) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
All tasks are done
Results:  [
  'Task 1 is finished',
  'Task 3 is finished',
  'Task 2 is finished',
  'Task 6 is finished',
  'Task 7 is finished',
  'Task 5 is finished',
  Error: Error happened on task 4
      at Timeout._onTimeout (/media/andrvm/SAMSUNG/PROJECTS/tmp/promise-queue/src/index.js:48:24)
      at listOnTimeout (internal/timers.js:554:17)
      at processTimers (internal/timers.js:497:7)
]
Done in 29.79s.
```
