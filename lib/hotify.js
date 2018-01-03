const componentMap = (window.__SVELTE_HOT_MAP__ = {});

exports.register = function (id, component){

  component = hotify(id, component);

  componentMap[id] = {
    component,
    instances: []
  }

  return createProxy(id);
}

exports.reload = function(id, component){

  component = hotify(id, component);
  componentMap[id].component = component;

  componentMap[id].instances.slice().forEach(function(instance){
    instance && instance._rerender();
  });
}

//creates a proxy object that ensures
//resolution to the latest version of the component
function createProxy(id){
  return function ProxyComponent(options){
    return new componentMap[id].component(options)
  }
}

function removeFromMap(id, instance){
  componentMap[id].instances.forEach(function(comp, idx, instances){
    if(comp == instance){
      instances.splice(idx, 1);
    }
  });
}

function getDebugName(id, withBraces){
  return (withBraces ? '<' : '') +
  id.split('/').pop().split('.').shift() +
  (withBraces ? '>' : '');
}

function hotify(id, component){
  return (function(superclass){

    function hotComponent(options){
      superclass.call(this, options);

      //add id property and register itself in the global map
      this.id = id;
      componentMap[id].instances.push(this);
    }

    //class inheritence stuff
    if (superclass) hotComponent.__proto__ = superclass;

    hotComponent.prototype = Object.create(superclass && superclass.prototype);
    hotComponent.prototype.constructor = hotComponent;

    //augment _mount to keep track of `target` and `anchor`
    hotComponent.prototype._mount = function _mount(target, anchor, insertionPoint){
      this.__mountpoint = target;
      this.__anchor = anchor;
      if (insertionPoint){
        this.__insertionPoint = insertionPoint;
      }else{
        this.__insertionPoint = document.createComment(this._debugName || getDebugName(this.id, true));
        target.insertBefore(this.__insertionPoint, anchor);
      }

      anchor = this.__insertionPoint.nextSibling;

      if(target.nodeName == '#document-fragment' && insertionPoint){
        //handles #4 by forcing a target
        //if original target was a document fragment
        target = this.__insertionPoint.parentNode;
      }

      superclass.prototype._mount.call(this, target, anchor);
      this.__mounted = true;
    }

    //mark as unmounted
    hotComponent.prototype._unmount = function _unmount(){
      superclass.prototype._unmount.call(this);
      this.__mounted = false;
    }

    //remove from global map on destroy
    hotComponent.prototype.destroy = function _destroy(detach, keepInsertionPoint){
      removeFromMap(this.id, this);
      if(!keepInsertionPoint){
        var ip = this.__insertionPoint;
        ip && ip.parentNode && ip.parentNode.removeChild(ip);
      }
      superclass.prototype.destroy.call(this, detach);
    }

    //new method to reload rendered instances
    hotComponent.prototype._rerender = function _rerender(){
      var self = this,
      mountpoint = self.__mountpoint || null,
      anchor = self.__anchor || null,
      options = self.options,
      id = self.id,
      state = self.get(),
      isMounted = self.__mounted,
      insertionPoint = self.__insertionPoint;

      self.destroy(true, true);

      var _replacement = new componentMap[id].component(options);
      if (mountpoint && isMounted) {
        _replacement._fragment.c();
        _replacement._mount(mountpoint, anchor, insertionPoint);
        //preserve local state
        _replacement.set(state);
      }
    }

    return hotComponent;

  }(component));
}