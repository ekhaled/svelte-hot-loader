const componentMap = (window.__SVELTE_HOT_MAP__ = {});
let hotOptions = {
  noPreserveState: false
};

exports.configure = function (options) {
  hotOptions = Object.assign(hotOptions, options);
}

exports.register = function (id, component) {

  //store original component in registry
  componentMap[id] = {
    component,
    instances: []
  }

  return createProxy(id);
}

exports.reload = function (id, component) {

  //replace component in registry with newly loaded component
  componentMap[id].component = component;

  //re-render the proxies
  componentMap[id].instances.slice().forEach(function (instance) {
    instance && instance._rerender();
  });
}

function removeFromMap (instance) {
  componentMap[instance.id].instances.forEach(function (comp, idx, instances) {
    if (comp == instance) {
      instances.splice(idx, 1);
    }
  });
}

function getDebugName (id) {
  return `<${id.split('/').pop().split('.').shift()}>`;
}

/*
creates a proxy object that
decorates the original component with trackers
and ensures resolution to the
latest version of the component
*/
function createProxy (id) {
  return (function () {

    // ---- constructor ----

    function proxyComponent (options) {

      this.id = id;
      this.__mountpoint = null;
      this.__anchor = null;
      this.__insertionPoint = null;
      this.__mounted = false;

      this._register(options);
    }

    // ---- END constructor ----


    // ---- augmented methods ----

    proxyComponent.prototype._mount = function (target, anchor, insertionPoint) {

      this.__mountpoint = target;
      this.__anchor = anchor;

      if (insertionPoint) {
        this.__insertionPoint = insertionPoint;
      } else {
        this.__insertionPoint = document.createComment(this._debugName || getDebugName(this.id));
        target.insertBefore(this.__insertionPoint, anchor);
      }

      anchor = this.__insertionPoint.nextSibling;

      if (target.nodeName == '#document-fragment' && insertionPoint) {
        //handles #4 by forcing a target
        //if original target was a document fragment
        target = this.__insertionPoint.parentNode;
      }

      this.__mounted = true;

      return this.proxyTarget._mount(target, anchor);
    }

    proxyComponent.prototype.destroy = function (detach, keepInsertionPoint) {
      removeFromMap(this);
      if (!keepInsertionPoint) {
        var ip = this.__insertionPoint;
        ip && ip.parentNode && ip.parentNode.removeChild(ip);
      }
      return this.proxyTarget.destroy(detach);
    }


    proxyComponent.prototype._unmount = function () {
      this.__mounted = false;
      return this.proxyTarget._unmount.apply(this.proxyTarget, arguments);
    }

    // ---- END augmented methods ----



    // ---- extra methods ----

    proxyComponent.prototype._register = function(options){

      //resolve to latest version of component
      this.proxyTarget = new componentMap[id].component(options);

      //register current instance, so that
      //we can re-render it when required
      componentMap[id].instances.push(this);

      //expose properties that might be used from outside
      this._fragment = this.proxyTarget._fragment;
      this._slotted = this.proxyTarget._slotted;
      this.root = this.proxyTarget.root;
      this.store = this.proxyTarget.store || null;
    }

    proxyComponent.prototype._rerender = function () {
      var mountpoint = this.__mountpoint || null,
      anchor = this.__anchor || null,
      options = this.proxyTarget.options,
      id = this.id,
      state = this.get(),
      isMounted = this.__mounted,
      insertionPoint = this.__insertionPoint;

      this.destroy(true, true);

      this._register(options);

      if (mountpoint && isMounted) {
        this.proxyTarget._fragment.c();
        this._mount(mountpoint, anchor, insertionPoint);

        //preserve local state (unless noPreserveState is true)
        if  (
          !this.proxyTarget.constructor.noPreserveState
          && !hotOptions.noPreserveState) {
            this.set(state);
        }
      }
    }

    // ---- END extra methods ----


    // ---- forwarded methods ----

    'get,fire,observe,on,set,teardown,_recompute,_set'.split(',')
    .forEach(function (method) {
      return proxyComponent.prototype[method] = function () {
        return this.proxyTarget[method].apply(this.proxyTarget, arguments)
      }
    });

    // ---- END forwarded methods ----

    return proxyComponent;

  }());
}