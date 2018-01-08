import Registry from './componentRegistry';

let proxyOptions = {
  noPreserveState: false
};

function getDebugName(id) {
  return `<${id.split('/').pop().split('.').shift()}>`;
}

function groupStart(msg) {
  console.group && console.group(msg);
}

function groupEnd() {
  console.groupEnd && console.groupEnd();
}


export {Registry};

export function configure(_options) {
  proxyOptions = Object.assign(proxyOptions, _options);
}

/*
creates a proxy object that
decorates the original component with trackers
and ensures resolution to the
latest version of the component
*/
export function createProxy(id){
  class proxyComponent{

    constructor (options) {
      this.id = id;
      this.__mountpoint = null;
      this.__anchor = null;
      this.__insertionPoint = null;
      this.__mounted = false;

      this._debugName = this._debugName || getDebugName(this.id);

      this._register(options);

      // ---- forwarded methods ----
      const self = this;
      'get,fire,observe,on,set,teardown,_recompute,_set'.split(',')
      .forEach(function (method) {
        return self[method] = function () {
          return self.proxyTarget[method].apply(self.proxyTarget, arguments)
        }
      });
      // ---- END forwarded methods ----
    }

    // ---- augmented methods ----

    _mount (target, anchor, insertionPoint) {

      this.__mountpoint = target;
      this.__anchor = anchor;

      if (insertionPoint) {
        this.__insertionPoint = insertionPoint;
      } else {
        this.__insertionPoint = document.createComment(this._debugName);
        target.insertBefore(this.__insertionPoint, anchor);
      }

      this.__insertionPoint.__component__ = this;

      anchor = this.__insertionPoint.nextSibling;

      if (target.nodeName == '#document-fragment' && insertionPoint) {
        //handles #4 by forcing a target
        //if original target was a document fragment
        target = this.__insertionPoint.parentNode;
      }

      this.__mounted = true;

      return this.proxyTarget._mount(target, anchor);
    }

    destroy (detach, keepInsertionPoint) {

      Registry.deRegisterInstance(this);

      if (!keepInsertionPoint) {
        //deref for GC before removal of node
        this.__insertionPoint.__component__ = null;
        const ip = this.__insertionPoint;
        ip && ip.parentNode && ip.parentNode.removeChild(ip);
      }
      return this.proxyTarget.destroy(detach);
    }

    _unmount () {
      this.__mounted = false;
      return this.proxyTarget._unmount.apply(this.proxyTarget, arguments);
    }

    // ---- END augmented methods ----


    // ---- extra methods ----

    _register (options) {

      const record = Registry.get(this.id);

      try {

        //resolve to latest version of component
        this.proxyTarget = new record.component(options);

      } catch (e) {

        const rb = record.rollback;

        if (!rb) {
          console.error(e);
          console.warn('Full reload required. Please fix component errors and reload the whole page');
          return;
        }

        groupStart(this._debugName + ' Errors');

        console.warn(e);
        console.warn(this._debugName + ' could not be hot-loaded because it has an error');

        //resolve to previous working version of component
        this.proxyTarget = new rb(options);
        console.info('%c' + this._debugName + ' rolled back to previous working version', 'color:green');

        //set latest version as the rolled-back version
        record.component = rb;

        groupEnd();

      }

      Registry.set(this.id, record);

      //register current instance, so that
      //we can re-render it when required
      Registry.registerInstance(this);

      //(re)expose properties that might be used from outside
      this._fragment = this.proxyTarget._fragment;
      this._slotted = this.proxyTarget._slotted;
      this.root = this.proxyTarget.root;
      this.store = this.proxyTarget.store || null;
    }

    _rerender () {
      const mountpoint = this.__mountpoint || null,
        anchor = this.__anchor || null,
        options = this.proxyTarget.options,
        id = this.id,
        oldstate = this.get(),
        isMounted = this.__mounted,
        insertionPoint = this.__insertionPoint;

      this.destroy(true, true);

      this._register(options);

      if (mountpoint && isMounted) {
        this.proxyTarget._fragment.c();
        this._mount(mountpoint, anchor, insertionPoint);

        //preserve local state (unless noPreserveState is true)
        if (
          !this.proxyTarget.constructor.noPreserveState
          && !proxyOptions.noPreserveState) {
          this.set(oldstate);
        } else {

          //we have to call .set() here
          //otherwise oncreate is not fired
          this.set(this.get());

        }
      }
    }

    // ---- END extra methods ----
  }

  return proxyComponent;
}
