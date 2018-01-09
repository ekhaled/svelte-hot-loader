
class registry{
  constructor () {
    this._items = {};
  }

  set (k, v) {
    this._items[k] = v
  }

  get (k) {
    return k ? this._items[k] || undefined : this._items;
  }

  registerInstance (instance) {
    const id = instance.id;
    this._items[id] && this._items[id].instances.push(instance);
  }

  deRegisterInstance (instance) {
    const id = instance.id;
    this._items[id] && this._items[id].instances.forEach(function (comp, idx, instances) {
      if (comp == instance) {
        instances.splice(idx, 1);
      }
    });
  }

}

const componentRegistry = (window.__SVELTE_REGISTRY__ = new registry);

export default componentRegistry;