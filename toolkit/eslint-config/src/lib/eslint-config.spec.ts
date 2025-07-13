import { eslintConfig } from './eslint-config';

describe('eslintConfig', () => {
  it('should work', () => {
    expect(eslintConfig()).toEqual('eslint-config');
  });
});
