## svelte-hot-loader
Webpack hot loader for svelte components

---

**Please Note:** This is alpha software, many of the functionalities aren't a 100% yet.

---

This loader does **not** replace [svelte-loader](https://github.com/sveltejs/svelte-loader). It is meant to be chained in conjuction with svelte-loader. For example:

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

---

##### Steps to v1:

 - [x] Basic module reload
 - [x] Re-render component in place
 - [x] Ensure components work with `Store`
 - [x] Preserve internal state on re-render
 - [x] Ensure re-rendered components keep their place instead of just being appended to the `parentNode`
 - [x] Update references of components inside parent components, so that when parents try to render children, the newest version of child component is rendered
 - [ ] Handle placement problems with components in `if/else` blocks
 - [ ] Handle stuff inside `<slots>`

 ---

 Heavily inspired by prior art of [react-hot-loader](https://github.com/gaearon/react-hot-loader) and [vue-hot-loader](https://github.com/jshmrtn/vue-hot-loader)
