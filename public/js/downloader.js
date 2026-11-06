/**
 * Website Downloader — frontend logic (Socket.IO v4).
 *
 * Mirrors the exact event protocol used by the server, keyed by a client token:
 *   { progress: 'Starting' }              → job accepted
 *   { progress: '<wget output line>' }    → live download stream
 *   { progress: 'Converting' }            → download done, producing ZIP
 *   { progress: 'Completed', file, files } → ZIP ready (file = name.zip)
 *   { error: '<message>' }                → failure
 *
 * The UI uses an indeterminate progress bar because the backend does not emit a
 * genuine overall-percentage value. File counts are shown only when real data
 * is available (parsed from the wget log, and the authoritative count reported
 * on completion). No fake percentages or invented counts are ever displayed.
 */
(function () {
  'use strict';

  var form = document.getElementById('download-form');
  var input = document.getElementById('url-input');
  var errorEl = document.getElementById('url-error');
  var downloadBtn = document.getElementById('download-btn');

  var connStatus = document.getElementById('conn-status');
  var progressBlock = document.getElementById('progress-block');
  var progressTrack = document.getElementById('progress-track');
  var progressBar = document.getElementById('progress-bar');
  var statusText = document.getElementById('status-text');
  var fileCountEl = document.getElementById('file-count');
  var logEl = document.getElementById('log');
  var cancelBtn = document.getElementById('cancel-btn');

  var resultBlock = document.getElementById('result-block');
  var successMsg = document.getElementById('success-msg');
  var resultFiles = document.getElementById('result-files');
  var zipNameEl = document.getElementById('zip-name');
  var zipBtn = document.getElementById('zip-btn');

  var errorBanner = document.getElementById('error-banner');
  var errorMsg = document.getElementById('error-msg');
  var retryBtn = document.getElementById('retry-btn');

  var URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  var token = getToken();
  var socket = null;
  var numberOfFiles = 0;

  function generateToken(len) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var out = '';
    var arr = new Uint32Array(len);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(arr);
      for (var i = 0; i < len; i++) out += chars[arr[i] % chars.length];
      return out;
    }
    for (var j = 0; j < len; j++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function getToken() {
    try {
      var t = localStorage.getItem('token');
      if (!t) {
        t = generateToken(20);
        localStorage.setItem('token', t);
      }
      return t;
    } catch (e) {
      return generateToken(20);
    }
  }

  /* ---------------- UI state helpers ---------------- */

  function setError(text) {
    errorMsg.textContent = text;
    errorBanner.hidden = false;
  }

  function clearError() {
    errorBanner.hidden = true;
    errorMsg.textContent = '';
  }

  function setStatus(text) {
    statusText.textContent = text;
    progressTrack.setAttribute('aria-valuenow', '0');
  }

  function setFileCount(count) {
    numberOfFiles = count;
    fileCountEl.textContent = count === 1 ? '1 file' : count + ' files';
  }

  function showProgress() {
    progressBlock.hidden = false;
    resultBlock.hidden = true;
    clearError();
    progressBar.classList.add('indeterminate');
    cancelBtn.hidden = false;
  }

  function hideProgress() {
    progressBlock.hidden = true;
    cancelBtn.hidden = true;
  }

  function appendLog(text) {
    if (!text) return;
    var line = text.replace(/\r/g, '');
    if (logEl.textContent) logEl.textContent += '\n';
    logEl.textContent += line;
    logEl.scrollTop = logEl.scrollHeight;
  }

  // Count genuinely saved files from wget output lines (best effort; the final
  // authoritative count arrives in the Completed event).
  function countSavedFiles(text) {
    var count = 0;
    var re = /saved\s+\[[^\]]*\]/i;               // "saved [123/456]"
    var mapping = /['\u2018].*?['\u2019]\s*->/g;   // "'file' ->"
    if (re.test(text)) count++;
    while (mapping.exec(text)) count++;
    return count;
  }

  /* ---------------- Event handling ---------------- */

  function handleEvent(event) {
    if (!event || typeof event !== 'object') return;

    // Failure (also triggered by cancel on the server side).
    if (event.error) {
      hideProgress();
      downloadBtn.disabled = false;
      setError(String(event.error));
      return;
    }

    var progress = event.progress;

    // ZIP ready.
    if (progress === 'Completed') {
      hideProgress();
      downloadBtn.disabled = false;

      var file = String(event.file || '');
      var count = typeof event.files === 'number' ? event.files : numberOfFiles;

      zipNameEl.textContent = file;
      zipBtn.href = '/download/' + encodeURIComponent(file);
      resultFiles.textContent = count === 1 ? '1 file collected' : count + ' files collected';
      successMsg.textContent = 'Your ZIP archive is ready.';
      resultBlock.hidden = false;
      if (resultBlock.scrollIntoView) resultBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Packaging phase.
    if (progress === 'Converting') {
      showProgress();
      setStatus('Website download completed. Creating ZIP archive…');
      cancelBtn.hidden = true;
      return;
    }

    // wget live output stream.
    if (typeof progress === 'string' && progress) {
      showProgress();
      setStatus('Downloading…');
      var added = countSavedFiles(progress);
      if (added > 0) setFileCount(numberOfFiles + added);
      appendLog(progress);
    }
  }

  /* ---------------- Actions ---------------- */

  function resetToIdle() {
    input.value = '';
    input.disabled = false;
    downloadBtn.disabled = false;
    clearError();
    hideProgress();
    resultBlock.hidden = true;
    logEl.textContent = '';
    setFileCount(0);
  }

  function startDownload(raw) {
    clearError();
    setFileCount(0);
    logEl.textContent = '';
    showProgress();
    setStatus('Starting…');
    downloadBtn.disabled = true;
    input.disabled = true;

    socket.emit('request', { token: token, website: raw });
  }

  function submit() {
    var raw = (input.value || '').trim();
    if (!raw) {
      errorEl.textContent = 'Please enter a website URL.';
      errorEl.hidden = false;
      input.focus();
      return;
    }
    if (!URL_RE.test(raw)) {
      errorEl.textContent = 'That does not look like a public http(s) URL. Try https://example.com';
      errorEl.hidden = false;
      input.focus();
      return;
    }
    errorEl.hidden = true;
    startDownload(raw);
  }

  /* ---------------- Wiring ---------------- */

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submit();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      if (socket) socket.emit('cancel', { token: token });
      hideProgress();
      downloadBtn.disabled = false;
      input.disabled = false;
      connStatus.textContent = 'Download cancelled.';
      connStatus.hidden = false;
      if (connStatus.isError) connStatus.classList.remove('is-error');
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      resetToIdle();
      input.focus();
    });
  }

  input.addEventListener('input', function () { errorEl.hidden = true; });

  /* ---------------- Socket ---------------- */

  function connect() {
    if (!window.io) {
      connStatus.textContent = 'Connection error: socket client not loaded.';
      connStatus.classList.add('is-error');
      connStatus.hidden = false;
      return;
    }
    socket = window.io();

    socket.on('connect', function () {
      connStatus.hidden = true;
    });

    socket.on('disconnect', function () {
      if (!form || form.hasAttribute('data-sent')) return;
      connStatus.textContent = 'Connection lost. Please try again.';
      connStatus.classList.add('is-error');
      connStatus.hidden = false;
      downloadBtn.disabled = false;
      input.disabled = false;
    });

    socket.on(token, handleEvent);

    socket.on('connect_error', function () {
      connStatus.textContent = 'Could not connect. Please refresh and try again.';
      connStatus.classList.add('is-error');
      connStatus.hidden = false;
    });
  }

  connect();
})();
