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

## How to bump and publish

```bash
# in root dir
npm run version
```

## How to add module to specified workspace

```bash
$ pnpm add @x-oasis/select-value --filter @infinite-list/data-model
```