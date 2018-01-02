const componentMap = (window.__SVELTE_HOT_MAP__ = {});

exports.register = function (id, component){

  component = hotify(id, component);

  componentMap[id] = {
    component,
    instances: []
  }

  return component;
}

exports.reload = function(id, component){

  component = hotify(id, component);
  componentMap[id].component = component;

  componentMap[id].instances.slice().forEach(function(instance){
    instance && instance._reload();
  })
}

function removeFromMap(id, instance){
  componentMap[id].instances.forEach(function(comp, idx, instances){
    if(comp == instance){
      instances.splice(idx, 1);
    }
  });
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
    hotComponent.prototype._mount = function _mount(target, anchor){
      this.__mountpoint = target;
      this.__anchor = anchor;
      superclass.prototype._mount.call(this, target, anchor);
      this.__mounted = true;
    }

    //mark as unmounted
    hotComponent.prototype._unmount = function _unmount(){
      superclass.prototype._unmount.call(this);
      this.__mounted = false;
    }

    //remove from global map on destroy
    hotComponent.prototype.destroy = function _destroy(detach){
      removeFromMap(this.id, this);
      superclass.prototype.destroy.call(this, detach);
    }

    //new method to reload rendered instances
    hotComponent.prototype._reload = function _reload(){
      var self = this,
      mountpoint = self.__mountpoint || null,
      anchor = self.__anchor || null,
      options = self.options,
      id = self.id,
      state = self.get(),
      isMounted = self.__mounted;

      self.destroy();

      var _replacement = new componentMap[id].component(options);
      if (mountpoint && isMounted) {
        _replacement._fragment.c();
        _replacement._mount(mountpoint, anchor);
        //preserve local state
        _replacement.set(state);
      }
    }

    return hotComponent

  }(component));
}