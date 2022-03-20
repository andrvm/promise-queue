/**
 * Promise queue example of use
 */

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


