/**
 * Types definitions
 */
interface IOptions {
  concurrency: number;
  pause: boolean;
  reRunCount: number;
  debug?: boolean;
};

interface ITask {
  id: number;
  function: any;
  result: any;
  reRunCounter: number;
};


/**
 * Promise queue
 * @param concurrency: amount of tasks that will be run immediately after adding
 * @param pause: if true, the queue will be suspended
 * @param count: if set, we will rerun failed task count times
 * @param debug: if true, output information about queueing will be provided
 *
 * @use:
 * const queue = new Queue({ concurrency: 3, pause: false, debug: true });
 */
export default class Queue {

  private queue: any[] = [];
  private pause: boolean = false;
  private debug: boolean = false;
  private reRunCount: number;
  private concurrency: number;
  private ongoingTasks: number[] = [];
  private finishedTasks: ITask[] = [];
  private tasksCount: number;

  constructor(options: IOptions) {
    this.concurrency = !options.concurrency ? 0 : options.concurrency;
    this.pause = !!options.pause;
    this.debug = !!options.debug;
    this.reRunCount = options.reRunCount;
  }

  /**
   * Add a function or bunch of then to be executed
   * @return array of tasks' results
   */
  public async add(task: Function | Function[]): Promise<any[]> {

    const queueingTasks = (task): void => {
      if (typeof task !== 'function') {
        new Error('A task should be a function');
      }
      new Promise((resolve, reject) => {
        const queueTask = { id: this.queue.length + 1, function: task, result: null, reRunCounter: 0};
        this.addTaskInQueue(queueTask,  resolve, reject);
      });
    }

    if (Array.isArray(task)) {
      task.forEach(t => {
        queueingTasks(t);
      });
    } else {
      queueingTasks(task);
    }

    // set number of all given tasks
    this.tasksCount = this.queue.length;

    if (!this.pause) {
      this.run();
    } else {
      if (this.debug) {
        console.log(`Queue is paused`);
      }
    }

    return new Promise(resolve => {
      const id = setInterval(() => {
       if (this.tasksCount === this.totalFinishedTasks()) {
         if (this.debug) {
           console.log('All tasks are done');
         }
         resolve(this.getResults());
         clearInterval(id);
       }
      }, 500);
    });

  }

  /**
   * Stop queening
   */
  public stop(): void {
    if (this.debug) {
      console.log(`Queue is paused`);
    }
    this.pause = true;
  }

  /**
   * Resume queening
   */
  public resume(): void {
    if (this.debug) {
      console.log(`Queue is resumed`);
    }
    this.pause = false;
    this.run();
  }

  /**
   * Returns tasks' results
   */
  private getResults(): any[] {
    return this.finishedTasks.map(t => t.result);
  }

  /**
   * Add a task in the queue
   */
  private addTaskInQueue(task: ITask, resolve: Function, reject: Function): void {
    this.queue.push(() => this.execute(task, resolve, reject));
  }


  /**
   * Task executor
   */
  private execute(task: ITask, resolve: Function, reject: Function): void {

    this.ongoingTasks.push(task.id);

    if (this.debug) {
      console.log(`Start executing task: ${task.id}`);
    }

    (task.function as () => Promise<any>)()
      .then(value => {
        resolve(value);
        task.result = value;
        this.finishTask(task);
      })
      .catch(error => {
        if (this.reRunCount && +task?.reRunCounter < this.reRunCount) {
          task.reRunCounter++;
          if (this.debug) {
            console.log(`Task: ${task.id} is run again, attempt # ${task.reRunCounter} `);
          }
          this.addTaskInQueue(task,  resolve, reject);
        } else {
          this.finishTask(task);
          task.result = error;
          reject(error);
          if (this.debug) {
            console.log(`Task: ${task.id} raise an exception`);
          }
        }
      })
      .finally(() => {
        this.run();
      });
  }

  /**
   * Amount of tasks that are being executed
   */
  private totalOutgoingTasks(): number {
    return this.ongoingTasks.length;
  }

  /**
   * Amount of tasks that are finished
   */
  private totalFinishedTasks(): number {
    return this.finishedTasks.length;
  }

  /**
   * Check whether we can proceed queuing
   * @private
   */
  private canNext(): boolean {
    if (this.pause || !this.queue.length) {
      return false;
    } else {
      return this.totalOutgoingTasks() < this.concurrency || this.totalFinishedTasks() > 0;
    }
  }

  /**
   * Start queening
   */
  private run(): void {
    while (this.canNext()) {
      const promise = this.queue.shift();
      if (promise) {
        promise();
      }
    }
  }

  private finishTask(task: ITask): void {
    this.ongoingTasks = this.ongoingTasks.filter(id => id !== task.id);
    this.finishedTasks.push(task);
    if (this.debug) {
      console.log(`Task: ${task.id} is finished`);
    }
  }

}
