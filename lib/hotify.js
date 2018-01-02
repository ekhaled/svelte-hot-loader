const componentMap = (window.__SVELTE_HOT_MAP__ = Object.create(null));

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
  //componentMap[id].component.prototype = component.prototype
  componentMap[id].instances.slice().forEach(function(instance){
    instance && instance._reload();
  })
}

function removeFromMap(id, instance){
  componentMap[id].instances.forEach(function(comp, idx, instances){
    if(comp == instance){
      console.log('found')
      instances[idx] = null;
    }
  });
}

function hotify(id, component){
  return (function(superclass){

    function hotComponent(options){
      superclass.call(this, options);
      this.id = id;
      componentMap[id].instances.push(this);
    }

    if (superclass) hotComponent.__proto__ = superclass;

    hotComponent.prototype = Object.create(superclass && superclass.prototype);
    hotComponent.prototype.constructor = hotComponent;

    hotComponent.prototype._mount = function _mount(target, anchor){
      console.log(id, 'mounted', target, anchor);
      this.__mountpoint = target;
      this.__anchor = anchor;
      superclass.prototype._mount.call(this, target, anchor);
      this.__mounted = true;
    }

    hotComponent.prototype._unmount = function _unmount(){
      superclass.prototype._unmount.call(this);
      this.__mounted = false;
    }

    hotComponent.prototype.destroy = function _destroy(detach){
      console.log('my destroy is called')
      if(detach !== false){
        removeFromMap(this.id, this);
      }
      superclass.prototype.destroy.call(this, detach);
    }

    hotComponent.prototype._reload = function _reload(){
      var self = this,
      mountpoint = self.__mountpoint || null,
      anchor = self.__anchor || null,
      options = self.options,
      id = self.id,
      state = self.get();

      self.destroy();

      var _replacement = new componentMap[id].component(options);
      console.log(mountpoint);
      if (mountpoint) {
        console.log('remounting ', _replacement._reload.toString())
        _replacement._fragment.c();
        _replacement._mount(mountpoint, anchor);
        //preserve local state
        _replacement.set(state);
      }
    }

    return hotComponent

  }(component));
}