/**
 * Express 4 does not forward rejected promises from async handlers to the
 * error middleware. Patch the Router so every async controller is wrapped.
 * Must be required before any route module.
 */
const { Router } = require('express');

const wrap = (fn) =>
  typeof fn !== 'function' || fn.length === 4
    ? fn
    : function wrapped(req, res, next) {
        try {
          const out = fn(req, res, next);
          if (out && typeof out.then === 'function') out.catch(next);
          return out;
        } catch (e) {
          next(e);
        }
      };

let patched = false;

module.exports = function patchAsyncErrors() {
  if (patched) return;
  patched = true;
  const methods = ['use', 'all', 'get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
  for (const method of methods) {
    const original = Router[method];
    if (!original) continue;
    Router[method] = function patchedMethod(...args) {
      return original.apply(this, args.map((a) => (typeof a === 'function' ? wrap(a) : a)));
    };
  }
};
