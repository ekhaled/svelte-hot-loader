const componentMap = (window.__SVELTE_HOT_MAP__ = Object.create(null));

exports.register = function (id, component){
  console.log('registering', id, component);

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
    instance && instance._reload(component);
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
      if(detach !== false){
        removeFromMap(this.id, this);
      }
      superclass.prototype._unmount.call(this, detach);
    }

    hotComponent.prototype._reload = function _reload(replacement){
      var self = this,
      mountpoint = self.__mountpoint || null,
      anchor = self.__anchor || null,
      options = self.options;

      self.destroy();

      var _replacement = new replacement(options);
      if (mountpoint) {
        console.log('remounting ', _replacement._fragment.c.toString())
        _replacement._fragment.c();
        _replacement._fragment.m(mountpoint, anchor);
      }
    }

    return hotComponent

  }(component));
}