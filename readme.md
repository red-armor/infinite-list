# Infinite List

## Precondition

- pnpm>=7
- node>=16

```bash
pnpm i
```

## How to build

```bash
# in root dir
pnpm run build # will run all packages build
```

## How to do test

```bash
# in root dir
pnpm run test # will run all packages test in CI mode(not watch mode)
```

If test single package only, cd to package dir.

```bash
cd packages/NAME
npm run test
```

## How to run website

```bash
# in root dir
npm run docs:dev
```

open [http://localhost:5173/](http://localhost:5173/)

## How to start examples

### ReactNative

```bash
$ cd examples/ReactNativeListPlayground
$ yarn
$ npm run start
```

## How to bump and publish

- merge feature to `next` branch
- update local `next` branch to latest
- run `pnpm changeset` to create version change
  - select need to publish repo with version type ('major' | 'minor' | 'patch')
  - then commit change
  - push to origin
- `next` will trigger `github automation`, if run success it will create `[ci] release` in pull request tab
- merge `[ci] release` request, then it will trigger publish

## How to add module to specified workspace

```bash
$ pnpm add @x-oasis/select-value --filter @infinite-list/data-model
```
