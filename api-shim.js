// جایگزین google.script.run با fetch تا کد صفحه بدون تغییر کار کند.
(function () {
  function call(fn, args, onOk, onFail) {
    if (!window.API_URL || window.API_URL.indexOf('PASTE_YOUR') === 0) {
      if (onFail) onFail(new Error('آدرس سرور در config.js تنظیم نشده است.'));
      return;
    }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 90000) : null;
    fetch(window.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, args: args }),
      redirect: 'follow',
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (res && res.ok) { if (onOk) onOk(res.data); }
        else if (onFail) { var e = new Error((res && res.error) || 'خطای ناشناخته از سرور'); if (res && res.code) e.code = res.code; onFail(e); }
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        var msg = err && err.name === 'AbortError' ? 'پاسخ سرور طول کشید؛ اینترنت را بررسی و دوباره تلاش کنید.' : 'ارتباط با سرور برقرار نشد؛ اینترنت را بررسی کنید.';
        if (onFail) onFail(new Error(msg));
      });
  }
  function makeRunner(ok, fail) {
    return new Proxy({}, {
      get: function (_t, prop) {
        if (prop === 'withSuccessHandler') return function (f) { return makeRunner(f, fail); };
        if (prop === 'withFailureHandler') return function (f) { return makeRunner(ok, f); };
        return function () { call(String(prop), Array.prototype.slice.call(arguments), ok, fail); };
      }
    });
  }
  window.google = window.google || {};
  window.google.script = { run: makeRunner(null, null) };
})();
