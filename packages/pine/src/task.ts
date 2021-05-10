import pify from 'pify';
import { isObject } from '@pinefile/utils';
import { ArgumentsType } from './args';
import { getConfig } from './config';
import { PineFileType } from './file';
import { getRunner } from './runner';
import { log, color, timeInSecs } from './logger';

/**
 * Determine if input value is a valid task value.
 *
 * @param  {object} val
 *
 * @return {boolean}
 */
export const validTaskValue = (val: any) => {
  return (
    typeof val === 'function' ||
    (isObject(val) &&
      !!Object.keys(val).length &&
      (typeof val._ === 'undefined' || typeof val._ === 'function'))
  );
};

/**
 * Resolve task function by name.
 *
 * @param {string} obj
 * @param {string} key
 * @param {string} sep
 *
 * @return {function|boolean}
 */
export const resolveTask = (obj: PineFileType, key: string, sep = ':'): any => {
  if (!key) {
    return false;
  }

  const properties = (Array.isArray(key) ? key : key.split(sep)) as string[];
  const task = properties.reduce((prev: any[], cur: string) => {
    return prev[cur] || false;
  }, obj as any) as any;

  if (!isObject(task) && !validTaskValue(task)) {
    return false;
  }

  if (isObject(task) && task._) {
    return task._;
  }

  if (isObject(task.default)) {
    task.default = task.default._;
  }

  return task;
};

/**
 * Get task function name with prefix.
 *
 * @param {string} name
 * @param {string} prefix
 * @param {string} sep
 *
 * @return {string}
 */
const getFnName = (name: string, prefix = '', sep = ':'): string => {
  const names = name.split(sep);
  const lastName = names.pop();
  return names.concat(`${prefix}${lastName}`).join(sep);
};

const doneify = (fn: any, ...args: any[]) => async (done: any) => {
  try {
    await pify(fn, { excludeMain: true })(args);
    done();
  } catch (err) {
    done(err);
  }
};

/**
 * Execute task in pinefile object.
 *
 * @param {object} pinefile
 * @param {string} name
 * @param {array}  args
 *
 * @return {Promise}
 */
const execute = async (
  pinefile: PineFileType,
  name: string,
  args: ArgumentsType
): Promise<void> => {
  const config = getConfig();

  let fn = resolveTask(pinefile, name);
  let fnName = name;

  // eslint-disable-next-line prefer-const
  let { runner, options } = getRunner(config);
  if (typeof runner === 'function') {
    fn = runner;
  }

  // use default function in objects.
  if (isObject(fn) && fn.default) {
    fn = fn.default;
    fnName = name !== 'default' ? `${name}:default` : 'default';
  }

  // fail if no task function can be found
  if (typeof fn !== 'function') {
    log.error(`Task ${color.cyan(`'${name}'`)} not found`);
    return;
  }

  switch (fn.length) {
    case 4:
      // runner function with options
      runner = fn(pinefile, name, args, options);
      break;
    case 3:
      // 3: plugin or runner function.
      runner = fn(pinefile, name, args);
      break;
    default:
      // 1: task function.
      runner = async (done: any) => {
        try {
          const fn2 = pify(fn, { excludeMain: true });
          const fn2Type = typeof fn2;
          if (fn2Type === 'function') {
            await fn2(args);
            done();
          } else {
            throw new Error(
              `Expected task function to be a function, got ${
                fn2 === null ? 'null' : fn2Type
              }`
            );
          }
        } catch (err) {
          done(err);
        }
      };
      break;
  }

  // execute pre* function.
  const preName = getFnName(fnName, 'pre');
  const preFunc = resolveTask(pinefile, preName);
  if (preFunc) {
    await execute(pinefile, preName, args);
  }

  const startTime = Date.now();
  log.info(`Starting ${color.cyan(`'${name}'`)}`);

  // await for runner if Promise
  if (runner instanceof Promise) {
    runner = await runner;
  }

  // wrap runner with no arguments
  // with an callback function with
  // done function as a argument.
  if (!runner.length) {
    runner = doneify(runner);
  }

  return await runner(async (err: any) => {
    if (err) log.error(err);

    const time = Date.now() - startTime;

    log.info(
      `Finished ${color.cyan(`'${name}'`)} after ${color.magenta(
        timeInSecs(time)
      )}`
    );

    // execute post* function.
    const postName = getFnName(fnName, 'post');
    const postFunc = resolveTask(pinefile, postName);
    if (postFunc) {
      await execute(pinefile, postName, args);
    }
  });
};

/**
 * Run task in pinefile.
 *
 * @param {object} pinefile
 * @param {string} name
 * @param {object} args
 *
 * @return {Promise}
 */
export const runTask = async (
  pinefile: PineFileType,
  name: string,
  args: ArgumentsType = {}
) => {
  return await execute(pinefile, name, args);
};
