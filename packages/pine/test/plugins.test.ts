describe('plugins', () => {
  let run: any = null;
  let spyLog: any = null;

  beforeEach(() => {
    jest.resetModules();
    spyLog = jest.spyOn(console, 'log');
    run = require('../src').runCLI;
  });

  afterEach(() => {
    spyLog.mockRestore();
  });

  it('should run pinefile with built in plugins', async () => {
    const file = `--file=${__dirname}/fixtures/pinefile.plugins.builtin.js`;
    const tests = [
      {
        task: 'pkg',
        test: () => {
          expect(spyLog).toHaveBeenCalledWith('pkg: 1.0.0');
        },
      },
    ];

    tests.forEach(async (test) => {
      await run([test.task, file]);
      test.test();
    });
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
      run([
        test.task,
        `--file=${__dirname}/fixtures/pinefile.plugins.${test.file}.js`,
      ]);
      test.test();
    });
  });
});
