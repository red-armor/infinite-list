export interface PkgOptions {
  main: string,
  module?: string,
  exports?: {
    [key: string]: {
      import?: string,
      default?: string,
      types?: string,
    }
  }
}

export type ResolveModulePath = (pkgOptions: PkgOptions, packageName: string, modulePath: string) => {
  [key: string]: string
}

export interface ResolveModuleOptions {
  rootPath: string
  modulePath: string
  resolveModulePath?: ResolveModulePath
}

export interface ResolveModulesOptions {
  rootPath?: string
  targetDir: string
  resolveModulePath?: ResolveModulePath
}

export interface PackageJson {
  name: string
  main: string
  exports?: Record<string, any>
  module?: string
  dependencies?: Record<string, string>
}

export interface MappingRecord {
  [key: string]: string
}
