## svelte-hot-loader
Webpack hot loader for svelte components

![Demo](https://www.dropbox.com/s/26gtw2cyllk5t4u/svelte-hot-loader.gif?raw=1)

---

### Installation
```
$ npm install svelte-hot-loader --save-dev
```
### Usage

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

### Hot reload rules and caveats:

 - `_rerender` and `_register` are reserved method names, please don't use them in `methods:{...}`
 - Turning `dev` mode on (`dev:true`) in `svelte-loader` is **not** necessary.
 - Modifying the HTML (template) part of your component will replace and re-render the changes in place. Current local state of the component will also be preserved (this can be turned off per component see [Stop preserving state](#stop-preserving-state)).
 - When modifying the `<script>` part of your component, instances will be replaced and re-rendered in place too.
  However if your component has lifecycle methods that produce global side-effects, you might need to reload the whole page.
 - During development do not use `extract-text-webpack-plugin` to extract the component's css into another file. Let it get handled by svelte. You can always turn it on when creating production builds
 - If you are using `svelte/store`, a full reload is required if you modify `store` properties

### Turning Hot reload off

Components will not be hot reloaded in the following situations:
 1. `process.env.NODE_ENV === 'production'`
 2. Webpack is minifying code
 3. Webpack's `target` is `node` (i.e SSR components)

### Stop preserving state

Sometimes it might be necessary for some components to avoid state preservation on hot-reload.
Or in simpler terms, you don't want the local state of the component to remain as it is after a hot-reload.

This can be configured on a per-component basis by adding a property `noPreserveState = true` to the component's constructor using the `setup()` method. For example:
```js
export default {
  setup(comp){
    comp.noPreserveState = true;
  },
  data(){return {...}},
  oncreate(){...}
}
```

Or, on a global basis by adding `{noPreserveState: true}` to the webpack loader config. For example:
```js
{
    test: /\.html$/,
    exclude: /node_modules/,
    use: [
      {
        loader: "svelte-hot-loader",
        query: { noPreserveState: true } //<-- config option
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
```

**Please Note:** If you are using `svelte/store`, `noPreserveState` has no effect on `store` properties. Neither locally, nor globally.


---

PRs and issues always welcome :smile:

 ---

 Heavily inspired by prior art of [react-hot-loader](https://github.com/gaearon/react-hot-loader) and [vue-hot-loader](https://github.com/jshmrtn/vue-hot-loader)
