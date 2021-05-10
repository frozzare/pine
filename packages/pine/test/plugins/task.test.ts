import { parallel, series } from '../../src';
import { parsePineFile } from '../../src/file';
import pinefile from '../fixtures/pinefile.tasks';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

jest.setTimeout(10000);

let spyLog: any = null;

describe('plugins/task', () => {
  beforeEach(() => {
    spyLog = jest.spyOn(console, 'log');
  });

  afterEach(() => {
    spyLog.mockRestore();
  });

  test('should run pinefile with series of tasks', async (done) => {
    const plugin = series('s1', 's2');
    const task = plugin(parsePineFile(pinefile), '');

    await task(() => {
      done();
      expect(spyLog).toHaveBeenCalledWith('Cleaning...');
      expect(spyLog).toHaveBeenCalledWith('Building...');
    });
  });

  test('should run series of functions', async (done) => {
    const output: string[] = [];
    const tasks = [
      (ok: any) => {
        output.push('echo one');
        ok();
      },
      (ok: any) => {
        output.push('echo two');
        ok();
      },
    ];

    await series(tasks);

    done();
    expect(output).toEqual(['echo one', 'echo two']);
  });

  test('should run series of async functions', async (done) => {
    const output: string[] = [];
    const tasks = [
      async () => {
        await delay(100);
        output.push('echo one');
      },
      async () => {
        await delay(100);
        output.push('echo two');
      },
    ];

    await series(tasks);

    done();
    expect(output).toEqual(['echo one', 'echo two']);
  });

  test('should run pinefile with parallel of tasks', async (done) => {
    const plugin = parallel('p1', 'p2');
    const task = plugin(parsePineFile(pinefile), '');

    await task(() => {
      done();
      expect(spyLog).toHaveBeenCalledWith('Building...');
      expect(spyLog).toHaveBeenCalledWith('Cleaning...');
    });
  });

  test('should run parallel of functions', async (done) => {
    const output: string[] = [];
    const tasks = [
      (ok: any) => {
        setTimeout(() => {
          output.push('echo one');
          ok();
        }, 500);
      },
      (ok: any) => {
        output.push('echo two');
        ok();
      },
    ];

    await parallel(tasks);

    done();
    expect(output).toEqual(['echo two', 'echo one']);
  });

  test('should run parallel of async functions', async (done) => {
    const output: string[] = [];
    const tasks = [
      async () => {
        await delay(1500);
        output.push('echo one');
      },
      async () => {
        await delay(100);
        output.push('echo two');
      },
    ];

    await parallel(tasks);

    done();
    expect(output).toEqual(['echo two', 'echo one']);
  });
});
