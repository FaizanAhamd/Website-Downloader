# Website Downloader 💾

Download the **public, static content** of any website (HTML, CSS, images, JS files) as a ZIP archive.

> ⚠️ Note: This tool mirrors publicly accessible web pages. It **cannot** retrieve a site's private backend source code, databases, or server configuration.

## How it works

1. Express + Socket.IO web frontend
2. GNU Wget mirrors the site (`-mkEpnp`)
3. Archiver compresses the mirror into a ZIP
4. The ZIP is offered for download via a public link

## Requirements

- Node.js 18+
- GNU Wget on the server PATH
  - Debian/Ubuntu: `sudo apt install wget`
  - macOS: `brew install wget`
  - Windows: the bundled `wget.exe` is used automatically



## How to run it on vs code 🤔

- `git clone https://github.com/FaizanAhamd/Website-Downloader.git`
- `cd Website-downloader`
- `$ npm install`
- `$ npm start`
- `http://localhost:3000/`


Thank you,

Email: faizanraki42@gamail.com
