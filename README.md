# react-router-extends
This package aims to improve DX by taking advantage of 2 amazing packages ([react-router](https://reactrouter.com/) and [TypeScript](https://www.typescriptlang.org/)).

## How
- Navigate by `id` instead of `path`\
  Sometimes we might need to change some existing paths:
  + If using `path`: we have to find all the places need to be replaced. That can take time and may cause mistakes.
  + If using `id`: we don't need to change anything
- Autocomplete\
  Thanks to TypeScript, our job can be done faster than ever. When using `Link` component or `navigate` function, TS will help us by suggesting appropriate `id`
- Prevent mistakes\
  If we are using wrong `id` to navigate, TS will immediately throw an error to notify us

## Installation
- npm
```bash
npm install react-router-dom react-router-extends
```
- yarn
 ```bash
yarn add react-router-dom react-router-extends
```
- pnpm
```bash
pnpm add react-router-dom react-router-extends
```

## Example
Checkout this example for more information: https://stackblitz.com/edit/vitejs-vite-pkomeq?file=src%2FApp.tsx

---
Enjoy 😉 your coding
