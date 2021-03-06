import { api } from '../src';

describe('plugins', () => {
  let spyLog: any = null;

  beforeEach(() => {
    jest.resetModules();
    spyLog = jest.spyOn(console, 'log');
  });

  afterEach(() => {
    spyLog.mockRestore();
  });

  it('should run pinefile with with custom plugins', () => {
    const tests = [
      {
        task: 'echo',
        file: 'custom',
        test: () => {
          expect(spyLog).toHaveBeenCalledWith('Echo...');
        },
      },
      {
        task: 'test',
        file: 'custom',
        test: () => {
          expect(spyLog).toHaveBeenCalledWith(
            expect.stringContaining('Testing...')
          );
        },
      },
    ];

    tests.forEach((test) => {
      api.runCLI([
        test.task,
        `--file=${__dirname}/fixtures/pinefile.plugins.${test.file}.js`,
      ]);
      test.test();
    });
  });
});
