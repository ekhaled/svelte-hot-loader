## svelte-hot-loader
Webpack hot loader for svelte components

---

#### Installation
```
$ npm install svelte-hot-loader --save-dev
```
#### Usage

This loader **does not** replace [svelte-loader](https://github.com/sveltejs/svelte-loader). It is meant to be chained in conjuction with svelte-loader. For example:

```js
module:{
  rules:[
    ...
    {
      test: /\.html$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "svelte-hot-loader" //<-- chained to load output from svelte-loader
        },
        {
          loader: 'svelte-loader',
          query: {
            dev:true,
            emitCss: false,
            store: true
          }
        }
      ]
    }
    ...
  ]
}
```

A full example can be found in the [example repo](https://github.com/ekhaled/svelte-hot-loader-example).

#### Hot reload rules and caveats:

 - Turning `dev` mode on (`dev:true`) in `svelte-loader` is **not** necessary.
 - Modifying the HTML (template) part of your component will replace and re-render the changes in place. Current local state will also be preserved.
 - When modifying the `<script>` part of your component, instances will be replaced and re-rendered in place too.
  However if your component has lifecycle methods that produce global side-effects, you might need to reload the whole page.
 - During development do not use `extract-text-webpack-plugin` to extract the component's css into another file. Let it get handled by svelte. You can always turn it on when creating production builds
 - If you are using `svelte/store`, a full reload is required if you modify `store` properties

#### Turning Hot reload off

Components will not be hot reloaded in the following situations:
 1. `process.env.NODE_ENV === 'production'`
 2. Webpack is minifying code
 3. Webpack's `target` is `node` (i.e SSR components)

---

PRs and issues always welcome :smile:

 ---

 Heavily inspired by prior art of [react-hot-loader](https://github.com/gaearon/react-hot-loader) and [vue-hot-loader](https://github.com/jshmrtn/vue-hot-loader)
