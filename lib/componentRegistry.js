
class registry{
  constructor () {
    this.items = {};
  }

  set (k, v) {
    this.items[k] = v
  }

  get (k) {
    return k ? this.items[k] || undefined : this.items;
  }

  registerInstance (instance) {
    const id = instance.id;
    this.items[id] && this.items[id].instances.push(instance);
  }

  deRegisterInstance (instance) {
    const id = instance.id;
    this.items[id] && this.items[id].instances.forEach(function (comp, idx, instances) {
      if (comp == instance) {
        instances.splice(idx, 1);
      }
    });
  }

}

const componentRegistry = (window.__SVELTE_HOT_MAP__ = new registry);

export default componentRegistry;