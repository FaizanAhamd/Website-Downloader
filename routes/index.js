var express = require('express');
var path = require('path');
var fs = require('fs');
var createError = require('http-errors');
var config = require('../config');
var router = express.Router();

// Guarantee the private archive directory exists (fresh clones start empty).
try {
  fs.mkdirSync(path.resolve(config.download.archiveDir), { recursive: true });
} catch (err) {
  console.error('Could not create archive directory:', err.message);
}

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Website Downloader - Download and Mirror Websites' });
});

router.get('/download/:file', function (req, res, next) {
  var name = req.params.file || '';
  if (!/^[A-Za-z0-9._-]+\.zip$/.test(name)) return next(createError(404));

  var archiveDir = path.resolve(config.download.archiveDir);
  var resolved = path.resolve(archiveDir, name);
  if (!resolved.startsWith(archiveDir + path.sep)) return next(createError(404));

  res.download(resolved, name, function (dlErr) {
    if (dlErr) {
      // Transfer failed or was interrupted (partial bytes may have been sent).
      // The user already got (part of) the archive; delete it anyway so it
      // does not linger on disk and add to the retention sweep load.
      console.error('ZIP download failed:', name, dlErr.message);
    }
    // Best-effort cleanup on both success and failure. Ignore ENOENT
    // (file already gone or never existed) — not a real error.
    fs.unlink(resolved, function (unlinkErr) {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        console.error('Could not delete archive:', name, unlinkErr.message);
      } else if (!unlinkErr) {
        console.log('Deleted archive after download:', name);
      }
    });
  });
});

router.get('/privacy', function (req, res, next) {
  res.render('privacy', { title: 'Privacy Policy (Draft) - Website Downloader' });
});

router.get('/terms', function (req, res, next) {
  res.render('terms', { title: 'Terms of Service (Draft) - Website Downloader' });
});

module.exports = router;
