'use strict';

var fs = require('fs');
var path = require('path');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);
var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);

const mapping = {};
const processed = new Set();
/**
 * 清理包路径，移除不必要的 './' 部分并处理 '../' 回退
 * @param {string} packagePath - 要清理的包路径
 * @returns {string} - 清理后的路径
 */ function cleanPackagePath(packagePath) {
    // 先处理简单的 './' 移除
    const cleaned = packagePath.replace(/\/\.\//g, '/');
    // 处理 '../' 回退路径
    const parts = cleaned.split('/');
    const result = [];
    for (const part of parts){
        if (part === '..') {
            // 回退一级
            if (result.length > 0) {
                // 对于 scoped package，允许回退但不能少于 scope 部分
                if (result[0].startsWith('@') && result.length === 1) {
                    continue;
                } else {
                    result.pop();
                }
            }
        } else if (part === '.' || part === '') {
            continue;
        } else {
            result.push(part);
        }
    }
    return result.join('/');
}
const defaultResolveModulePath = (options, packageName, modulePath)=>{
    const { exports, module, main } = options;
    const mapping = {};
    if (exports) {
        for(const exportedKey in exports){
            const key = cleanPackagePath(`${packageName}/${exportedKey}`);
            const rawValue = exports[exportedKey];
            const value = rawValue.import || rawValue.default;
            if (value && fs__namespace.existsSync(path__namespace.join(modulePath, value))) {
                mapping[key] = path__namespace.join(modulePath, value);
            }
        }
    }
    if (module) {
        const resolvedModulePath = path__namespace.join(modulePath, module);
        if (fs__namespace.existsSync(resolvedModulePath)) {
            mapping[packageName] = resolvedModulePath;
        }
    }
    if (main) {
        const resolvedModulePath = path__namespace.join(modulePath, main);
        if (fs__namespace.existsSync(resolvedModulePath)) {
            mapping[packageName] = resolvedModulePath;
        }
    }
    return mapping;
};
const resolveModule = (options)=>{
    const { rootPath, modulePath, resolveModulePath = defaultResolveModulePath } = options;
    const packageJsonPath = path__namespace.join(modulePath, 'package.json');
    const packageJson = JSON.parse(fs__namespace.readFileSync(packageJsonPath, 'utf8'));
    const packageName = packageJson.name;
    if (processed.has(packageName)) {
        return;
    }
    processed.add(packageName);
    const resolvedMapping = resolveModulePath({
        exports: packageJson.exports,
        module: packageJson.module,
        main: packageJson.main
    }, packageName, modulePath);
    for(const key in resolvedMapping){
        mapping[key] = resolvedMapping[key];
    }
    if (packageJson.dependencies) {
        for(const dependencyName in packageJson.dependencies){
            if (processed.has(dependencyName)) {
                continue;
            }
            const dependencyPath = path__namespace.join(rootPath, dependencyName);
            if (fs__namespace.existsSync(dependencyPath)) {
                resolveModule({
                    rootPath: rootPath,
                    resolveModulePath,
                    modulePath: path__namespace.join(rootPath, dependencyName)
                });
            }
        }
    }
};
const resolveModules = (options)=>{
    const { rootPath = path__namespace.join(__dirname), targetDir, resolveModulePath = defaultResolveModulePath } = options || {};
    if (!targetDir) {
        console.error('targetDir is required');
        return undefined;
    }
    try {
        const targetPath = path__namespace.join(rootPath, targetDir);
        const subdirs = fs__namespace.readdirSync(targetPath, {
            withFileTypes: true
        }).filter((dirent)=>dirent.isDirectory()).map((dirent)=>dirent.name);
        for (const subdir of subdirs){
            resolveModule({
                rootPath: rootPath,
                resolveModulePath,
                modulePath: path__namespace.join(rootPath, targetDir, subdir)
            });
        }
        return mapping;
    } catch (err) {
        return mapping;
    }
};

exports.cleanPackagePath = cleanPackagePath;
exports.resolveModules = resolveModules;
