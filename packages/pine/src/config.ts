import path from 'path';
import debug from 'debug';
import dotenv from 'dotenv';
import { isObject } from '@pinefile/utils';
import { ConfigType, ConfigFunctionType } from './types';

let processed: Array<string> = [];

let config: ConfigType = {
  dotenv: [],
  env: {},
  options: {},
};

const loadDotenv = (config: ConfigType) => {
  if (!Array.isArray(config.dotenv)) {
    return;
  }

  config.dotenv
    .filter((file) => !processed.includes(file))
    .forEach((file) => {
      debug('dotenv')('loading', file);
      dotenv.config({
        path: `${path.join(path.dirname(config.pinefile), file)}`,
      });
      processed.push(file);
    });
};

const setEnvironment = (config: ConfigType) => {
  if (!isObject(config.env)) {
    return;
  }

  for (const key in config.env) {
    // use the same conditional to set env var as dotenv does
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key.toUpperCase()] = config.env[key];
    }
  }
};

export const getConfig = (): ConfigType => {
  return config;
};

export const configure = (
  newConfig: ConfigType | ConfigFunctionType
): ConfigType => {
  if (typeof newConfig === 'function') {
    newConfig = newConfig(config);
  }

  config = {
    ...config,
    ...(isObject(newConfig) ? newConfig : {}),
  };

  loadDotenv(config);
  setEnvironment(config);

  return config;
};
