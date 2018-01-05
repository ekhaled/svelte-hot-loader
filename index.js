const loaderUtils = require('loader-utils');

function loadHmr(file, options) {
  options = JSON.stringify(options);
  return `
        var component = require(${file});
        var hotify = require('svelte-hot-loader/lib/hotify');

        hotify.configure(${options});

        var proxyComponent = component;

        /* hot reload */
        if (module.hot) {
          proxyComponent = hotify.register(${file}, component.default);
          module.hot.accept(${file}, function() {
            var newComponent = require(${file});
            hotify.reload(${file}, newComponent.default);
          });
        }


        module.exports = proxyComponent;
    `;

}


module.exports = function load() {
};
module.exports.pitch = function pitch(remainingRequest) {
  const file = loaderUtils.stringifyRequest(this, '!!' + remainingRequest);
  const isServer = this.target === 'node';
  const isProduction = this.minimize || process.env.NODE_ENV === 'production';

  const options = Object.assign({
    noPreserveState: false
  }, loaderUtils.getOptions(this));

  if (this.cacheable) {
    this.cacheable();
  }

  if (isProduction || isServer) {
    return `module.exports = require(${file});`;
  }

  return loadHmr(file, options);
};