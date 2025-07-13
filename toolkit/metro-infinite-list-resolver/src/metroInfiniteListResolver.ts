import * as fs from 'fs';
import * as path from 'path';
import {
  MappingRecord,
  PackageJson,
  PkgOptions,
  ResolveModuleOptions,
  ResolveModulesOptions,
} from './types';

/**
 * 清理包路径，移除不必要的 './' 部分并处理 '../' 回退
 * @param {string} packagePath - 要清理的包路径
 * @returns {string} - 清理后的路径
 */
function cleanPackagePath(packagePath: string): string {
  // 先处理简单的 './' 移除
  const cleaned = packagePath.replace(/\/\.\//g, '/');

  // 处理 '../' 回退路径
  const parts = cleaned.split('/');
  const result: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      // 回退一级
      if (result.length > 0) {
        // 对于 scoped package，允许回退但不能少于 scope 部分
        if (result[0].startsWith('@') && result.length === 1) {
          // 不能回退到 scope 之前，保持当前状态
          continue;
        } else {
          result.pop();
        }
      }
    } else if (part === '.' || part === '') {
      // 跳过 '.' 和空字符串
      continue;
    } else {
      result.push(part);
    }
  }

  return result.join('/');
}

const defaultResolveModulePath = (
  options: PkgOptions,
  packageName: string,
  modulePath: string
) => {
  const { exports, module, main } = options;
  const mapping: MappingRecord = {};

  if (exports) {
    for (const exportedKey in exports) {
      const key = cleanPackagePath(`${packageName}/${exportedKey}`);
      const rawValue = exports[exportedKey];
      const value = rawValue.import || rawValue.default;
      if (value && fs.existsSync(path.join(modulePath, value))) {
        mapping[key] = path.join(modulePath, value);
      }
    }
  }

  if (module) {
    const resolvedModulePath = path.join(modulePath, module);
    if (fs.existsSync(resolvedModulePath)) {
      mapping[packageName] = resolvedModulePath;
    }
  } else if (main) {
    const resolvedModulePath = path.join(modulePath, main);
    if (fs.existsSync(resolvedModulePath)) {
      mapping[packageName] = resolvedModulePath;
    }
  }

  return mapping;
};

const resolveModule = (options: ResolveModuleOptions): void => {
  const {
    rootPath,
    modulePath,
    mapping,
    processed,
    resolveModulePath = defaultResolveModulePath,
  } = options;
  const packageJsonPath = path.join(modulePath, 'package.json');
  const packageJson: PackageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf8')
  );
  const packageName = packageJson.name;

  if (processed.has(packageName)) {
    return;
  }

  processed.add(packageName);

  const resolvedMapping = resolveModulePath(
    {
      exports: packageJson.exports,
      module: packageJson.module,
      main: packageJson.main,
    },
    packageName,
    modulePath
  );

  for (const key in resolvedMapping) {
    mapping[key] = resolvedMapping[key];
  }

  if (packageJson.dependencies) {
    for (const dependencyName in packageJson.dependencies) {
      if (processed.has(dependencyName)) {
        continue;
      }
      const dependencyPath = path.join(rootPath, dependencyName);
      if (fs.existsSync(dependencyPath)) {
        resolveModule({
          mapping,
          processed,
          rootPath: rootPath,
          resolveModulePath,
          modulePath: path.join(rootPath, dependencyName),
        });
      }
    }
  }
};

const resolveModules = (
  options?: ResolveModulesOptions
): MappingRecord | undefined => {
  const {
    rootPath = path.join(__dirname),
    targetDir,
    resolveModulePath = defaultResolveModulePath,
  } = options || {};

  const mapping: MappingRecord = {};
  const processed = new Set<string>();

  if (!targetDir) {
    console.error('targetDir is required');
    return undefined;
  }

  try {
    const targetPath = path.join(rootPath, targetDir);
    const subdirs = fs
      .readdirSync(targetPath, { withFileTypes: true })
      .filter((dirent: fs.Dirent) => dirent.isDirectory())
      .map((dirent: fs.Dirent) => dirent.name);

    for (const subdir of subdirs) {
      resolveModule({
        mapping,
        processed,
        rootPath: rootPath,
        resolveModulePath,
        modulePath: path.join(rootPath, targetDir, subdir),
      });
    }

    return mapping;
  } catch (err) {
    return mapping;
  }
};

export { resolveModules, cleanPackagePath };
