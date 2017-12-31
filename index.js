const loaderUtils = require('loader-utils');

function loadHmr(file) {
  return `
        var component = require(${file});

        var extendedComponent = component;

        /* hot reload */
        if (module.hot) {
          var extendedComponent = (function (superclass) {
            function extendedComponent(options){
              superclass.call(this, options);
              var self = this;

              module.hot.accept();

              module.hot.dispose(function(){
                console.log('disposed');

                var mountpoint = self.__mountpoint || null,
                anchor = self.__anchor || null,
                options = self.options;

                self.destroy();

                setTimeout(function(){
                  var reloaded = require(${file}),
                  _reloaded = new reloaded.default(options);
                  if(mountpoint){
                    console.log('remounting ${file}', reloaded.default.toString())
                    _reloaded._fragment.c();
                    _reloaded._fragment.m(mountpoint, anchor);
                  }
                });

              })
            }

            if ( superclass ) extendedComponent.__proto__ = superclass;

            extendedComponent.prototype = Object.create( superclass && superclass.prototype );
            extendedComponent.prototype.constructor = extendedComponent;

            extendedComponent.prototype._mount = function _mount (target, anchor){
              console.log('mounted', target, anchor);
              this.__mountpoint = target;
              this.__anchor = anchor;
              superclass.prototype._mount.call(this, target, anchor);
            };

            return extendedComponent;

          }(component.default));
        }


        module.exports = extendedComponent;
    `;

}


module.exports = function load() {
};
module.exports.pitch = function pitch(remainingRequest) {
  const file = loaderUtils.stringifyRequest(this, '!!' + remainingRequest);
  const isProduction = this.minimize || process.env.NODE_ENV === 'production';

  if (this.cacheable) {
    this.cacheable();
  }

  if (isProduction) {
    return `module.exports = require(${file});`;
  }

  return loadHmr(file);
};