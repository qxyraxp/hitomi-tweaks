// ==UserScript==
// @name         Hitomi Tweak
// @namespace    hitomi-tweaks
// @version      3.72
// @description  Poster grid, dark mode, dan reader scroll vertikal ala webtoon untuk hitomi.la (anti-kedip) + panel Filter Tag
// @description:en  Poster grid, dark mode, vertical webtoon-style reader and Tag Filter panel for hitomi.la (flicker-free)
// @author       qxyraxp
// @license      MIT
// @homepageURL  https://github.com/qxyraxp/hitomi-tweaks
// @supportURL   https://github.com/qxyraxp/hitomi-tweaks/issues
// @downloadURL  https://raw.githubusercontent.com/qxyraxp/hitomi-tweaks/main/hitomi-tweaks.user.js
// @updateURL    https://raw.githubusercontent.com/qxyraxp/hitomi-tweaks/main/hitomi-tweaks.user.js
// @match        https://hitomi.la/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  if (window.top !== window.self) return;
  if (document.getElementById('hmt-style')) return;

  /* ====================================================================
   * Helper dasar
   * ==================================================================== */
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const onReady = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  /* ====================================================================
   * Settings (localStorage)
   * ==================================================================== */
  const KEY = 'hmt:';
  const get = (k, d) => {
    try { const v = localStorage.getItem(KEY + k); return v === null ? d : JSON.parse(v); }
    catch { return d; }
  };
  const set = (k, v) => { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch {} };

  const state = {
    lang: get('lang', 'id'),               // bahasa antarmuka: 'id' | 'en'
    dark: get('dark', true),
    grid: get('grid', true),
    webtoon: get('webtoon', true),
    cardW: get('cardW', 190),
    cardStyle: get('cardStyle', 'detail'), // 'detail' (cover + tabel info) | 'poster'
    readerW: get('readerW', 800),
    thumbs: get('thumbs', true),         // thumbnail besar di halaman galeri
    thumbReader: get('thumbReader', false), // thumbnail pakai gambar reader (berat); default: thumbnail situs (ringan)
    thumbW: get('thumbW', 160),
    pvOn: get('pvOn', true),             // hover preview
    pvSize: get('pvSize', 80),           // tinggi preview, % tinggi layar
    pvDelay: get('pvDelay', 150),        // ms
    pvMode: get('pvMode', 'side'),       // 'side' | 'cursor'
    dlPanel: get('dlPanel', true),       // klik Download -> panel pilih gambar dulu
    dlFmt: get('dlFmt', 'orig'),         // format hasil unduhan: 'orig' | 'jpg'
    dlQ: get('dlQ', 90),                 // kualitas JPG (%)
    dlOut: get('dlOut', 'zip'),          // hasil: 'zip' | 'pdf' | 'img' (gambar lepas, perlu folder)
    dlDest: get('dlDest', 'dl'),         // tujuan: 'dl' (unduhan browser) | 'dir' (folder pilihan)
    toastPos: get('toastPos', 'br'),       // posisi notifikasi: br bl bc tr tl tc
    introScroll: get('introScroll', true),   // animasi kartu/thumbnail saat di-scroll
    introScrollStyle: get('introScrollStyle', 'same'), // 'same' = ikut gaya kartu, atau kunci INTRO_FX / 'mix'
    introBlock: get('introBlock', 'rise'),  // animasi cover + info di halaman galeri -> INTRO_FX
    introNav: get('introNav', 'slide'),    // animasi navbar (menu atas) -> HEAD_FX
    introBanner: get('introBanner', 'wipe'), // animasi banner judul -> HEAD_FX
    introOn: get('introOn', true),         // animasi kartu saat halaman dimuat
    introStyle: get('introStyle', 'rise'), // gaya animasi (lihat INTRO_FX)
    introOrder: get('introOrder', 'seq'),  // urutan muncul: 'seq' | 'diag' | 'rand'
    introSpeed: get('introSpeed', 1),      // pengali durasi animasi
    introStep: get('introStep', 80),       // jeda antar kartu (ms)
    stickyNav: get('stickyNav', true),   // header/navbar tetap terlihat saat scroll
    searchOn: get('searchOn', true),     // perpanjang kolom search
    searchW: get('searchW', 520),        // lebar kolom search (px)
    accent: get('accent', '#5b7cff'),    // warna aksen
    dlMark: get('dlMark', true),         // tandai galeri yang sudah diunduh
    dlThumb: get('dlThumb', 150),        // lebar minimum thumbnail di panel pilih unduhan (px)
    romaji: get('romaji', true),         // ubah tulisan Jepang di judul jadi romaji
    romajiKanji: get('romajiKanji', true), // pakai kamus (kuromoji) supaya kanji ikut diubah
    romajiLong: get('romajiLong', 'simple'), // vokal panjang: 'simple' (ou->o) | 'keep'
    tfInc: get('tfInc', []),             // filter tag: tag yang disertakan (query pencarian)
    tfExc: get('tfExc', []),             // filter tag: tag yang dikecualikan (diawali "-")
  };

  /* ====================================================================
   * Versi + bahasa (Indonesia / English)
   * Teks sumber di script ini berbahasa Indonesia; T() menerjemahkannya ke English
   * lewat kamus EN di bawah. {0}, {1} = nilai yang disisipkan.
   * ==================================================================== */
  const VERSION = '3.72';
  const AUTHOR = 'qxyraxp';
  const EN = {
    // --- panel: tab & judul bagian
    'Pengaturan': 'Settings', 'Tampilan': 'Appearance', 'Animasi': 'Animations', 'Thumbnail': 'Thumbnails',
    'Hover preview': 'Hover preview', 'Unduhan': 'Downloads', 'Lainnya': 'More',
    'Umum': 'General', 'Header': 'Header', 'Daftar galeri': 'Gallery list', 'Reader': 'Reader',
    'Saat halaman dimuat': 'On page load', 'Halaman galeri': 'Gallery page', 'Kartu & thumbnail': 'Cards & thumbnails',
    'Saat di-scroll': 'While scrolling', 'Thumbnail galeri': 'Gallery thumbnails', 'Judul': 'Titles',
    'Pratinjau saat hover': 'On hover', 'Panel unduhan': 'Download panel', 'Riwayat': 'History',
    'Pintasan': 'Shortcuts', 'Diagnostik': 'Diagnostics', 'Tentang': 'About',
    // --- panel: tampilan
    'Bahasa antarmuka panel dan notifikasi': 'Interface language for panels and notifications',
    'Mode gelap': 'Dark mode', 'Tema gelap untuk seluruh situs': 'Dark theme for the whole site',
    'Warna aksen': 'Accent color', 'Warna tombol, slider, dan penanda': 'Color of buttons, sliders and highlights',
    'Warna kustom': 'Custom color',
    'Posisi notifikasi': 'Notification position',
    'Tempat muncul pesan seperti "Kamus kanji siap"': 'Where messages such as "Kanji dictionary ready" appear',
    'Kanan bawah': 'Bottom right', 'Kiri bawah': 'Bottom left', 'Tengah bawah': 'Bottom center',
    'Kanan atas': 'Top right', 'Kiri atas': 'Top left', 'Tengah atas': 'Top center',
    'Header tetap di atas': 'Sticky header', 'Navbar (menu & pencarian) tidak hilang saat halaman di-scroll': 'The navbar (menu & search) stays visible while scrolling',
    'Perpanjang kolom search': 'Wider search box', 'Kolom pencarian di header dibuat lebih panjang': 'Makes the header search box longer',
    'Lebar kolom search': 'Search box width', 'Lebar kolom pencarian (px)': 'Width of the search box (px)',
    'Poster grid': 'Poster grid', 'Tampilkan galeri sebagai kartu poster': 'Show galleries as poster cards',
    'Gaya kartu': 'Card style', 'Detail: cover + tabel info seperti halaman galeri. Poster: cover penuh': 'Detail: cover + info table like the gallery page. Poster: full cover',
    'Detail': 'Detail', 'Poster': 'Poster',
    'Ukuran kartu': 'Card size', 'Lebar minimum tiap kartu poster': 'Minimum width of each poster card',
    'Mode webtoon': 'Webtoon mode', 'Scroll vertikal, semua halaman berurutan': 'Vertical scroll, all pages in sequence',
    'Lebar gambar': 'Image width', 'Lebar halaman pada mode webtoon (px)': 'Page width in webtoon mode (px)', 'Penuh': 'Full',
    // --- panel: animasi
    'Animasi saat memuat': 'Load animation', 'Header dan kartu muncul dengan animasi saat halaman dimuat': 'Header and cards animate in when the page loads',
    'Navbar (menu atas)': 'Navbar (top menu)', 'Efek masuk untuk logo, menu, dan kolom search': 'Entrance effect for the logo, menu and search box',
    'Banner judul': 'Title banner', 'Efek masuk untuk bar "Recently Added" (halaman daftar)': 'Entrance effect for the "Recently Added" bar (list pages)',
    'Cover & info': 'Cover & info', 'Efek masuk untuk cover, judul, dan tabel info saat membuka sebuah galeri': 'Entrance effect for the cover, title and info table when opening a gallery',
    'Gaya animasi': 'Animation style', 'Pilih efek masuk tiap kartu. Perubahan langsung dipratinjau di halaman': 'Pick the entrance effect for each card. Changes are previewed on the page',
    'Urutan muncul': 'Order', 'Berurutan: kiri ke kanan lalu ke bawah. Diagonal: menyapu dari pojok kiri-atas. Acak: urutan dikocok': 'Sequential: left to right, then down. Diagonal: sweeps from the top-left corner. Random: shuffled order',
    'Berurutan (kiri-atas)': 'Sequential (top-left)', 'Diagonal': 'Diagonal', 'Acak': 'Random',
    'Kecepatan': 'Speed', 'Durasi animasi tiap kartu': 'Animation duration of each card', 'Cepat': 'Fast', 'Normal': 'Normal', 'Lambat': 'Slow',
    'Jeda antar kartu': 'Delay between cards', 'Selisih waktu muncul antar kartu (ms)': 'Time gap between cards appearing (ms)',
    'Putar ulang': 'Replay', 'Pratinjau': 'Preview', 'Putar ulang animasi pada kartu yang sedang terlihat': 'Replay the animation on the cards currently visible',
    'Animasi saat di-scroll': 'Scroll animation', 'Kartu dan thumbnail di bawah layar muncul dengan animasi ketika di-scroll sampai ke situ': 'Cards and thumbnails below the screen animate in as you scroll to them',
    'Gaya saat di-scroll': 'Scroll style', 'Efek masuk untuk kartu yang baru terlihat. Coba scroll halaman untuk melihatnya': 'Entrance effect for newly visible cards. Try scrolling the page to see it',
    'Sama dengan gaya kartu': 'Same as card style', 'Campur (acak tiap kartu)': 'Mixed (random per card)',
    'Naik': 'Rise', 'Turun': 'Drop', 'Geser dari kiri': 'Slide from left', 'Pop (membal)': 'Pop (bouncy)', 'Balik 3D': '3D flip',
    'Kabur ke jelas': 'Blur to sharp', 'Tirai (kiri ke kanan)': 'Curtain (left to right)', 'Fade polos': 'Plain fade',
    'Geser dari kanan': 'Slide from right', 'Geser diagonal': 'Diagonal slide', 'Zoom mendekat': 'Zoom in',
    'Memantul dari bawah': 'Bounce from below', 'Miring masuk': 'Tilt in', 'Geser miring': 'Skewed slide', 'Putar masuk': 'Spin in',
    'Balik horizontal': 'Horizontal flip', 'Rebah 3D': '3D tilt', 'Iris (lingkaran membuka)': 'Iris (circle opens)',
    'Tirai (bawah ke atas)': 'Curtain (bottom to top)',
    'Tanpa animasi': 'No animation', 'Geser dari atas': 'Slide from top', 'Buka dari atas': 'Unfold from top', 'Zoom masuk': 'Zoom in',
    'Turun memantul': 'Bouncing drop', 'Balik 3D (dari atas)': '3D flip (from top)', 'Iris (melebar dari tengah)': 'Iris (expands from center)',
    'Bagian satu per satu': 'Part by part',
    // --- panel: thumbnail, romaji, preview
    'Thumbnail besar': 'Large thumbnails', 'Ganti strip thumbnail dengan grid besar': 'Replace the thumbnail strip with a large grid',
    'Resolusi asli': 'Original resolution', 'Pakai gambar reader di thumbnail (berat). Mati = ringan': 'Use reader images for thumbnails (heavy). Off = light',
    'Ukuran thumbnail': 'Thumbnail size', 'Lebar minimum tiap thumbnail': 'Minimum width of each thumbnail',
    'Judul ke romaji': 'Titles to romaji', 'Ubah tulisan Jepang (hiragana, katakana, kanji) di judul jadi huruf latin. Arahkan kursor ke kartu untuk melihat judul asli': 'Convert Japanese text (hiragana, katakana, kanji) in titles to Latin letters. Hover a card to see the original title',
    'Ubah kanji juga': 'Convert kanji too', 'Unduh kamus kanji sekali (±17 MB, lalu tersimpan di cache browser). Mati = hanya kana yang diubah': 'Downloads the kanji dictionary once (~17 MB, then cached by the browser). Off = only kana is converted',
    'Vokal panjang': 'Long vowels', 'Cara menulis vokal panjang: toukyou atau tokyo': 'How long vowels are written: toukyou or tokyo',
    'Sederhana': 'Simple', 'Apa adanya': 'As is',
    'Tampilkan halaman besar saat kursor di thumbnail': 'Show a large page when the cursor is over a thumbnail',
    'Ukuran preview': 'Preview size', 'Tinggi preview (% tinggi layar)': 'Preview height (% of screen height)',
    'Jeda muncul': 'Show delay', 'Waktu tunggu sebelum preview muncul': 'Wait time before the preview appears',
    'Posisi preview': 'Preview position', 'Di samping thumbnail atau mengikuti kursor': 'Beside the thumbnail or following the cursor',
    'Samping': 'Side', 'Kursor': 'Cursor',
    // --- panel: unduhan
    'Panel pilih unduhan': 'Download picker', 'Klik Download → pilih gambar dulu; jalan di latar belakang antar halaman': 'Click Download → choose images first; runs in the background across pages',
    'Hasil default': 'Default output', 'Bentuk file yang dihasilkan': 'Type of file produced', 'Gambar': 'Images', 'gambar': 'images',
    'Kualitas JPG/PDF': 'JPG/PDF quality', 'Dipakai untuk PDF atau konversi JPG': 'Used for PDF or JPG conversion',
    'Ukuran thumbnail panel': 'Panel thumbnail size', 'Lebar thumbnail di panel pilih gambar': 'Thumbnail width in the image picker',
    'Tandai yang sudah diunduh': 'Mark downloaded galleries', 'Badge "✓ Diunduh" dan kartu diredupkan di daftar galeri': '"✓ Downloaded" badge and dimmed cards in the gallery list',
    'Daftar sudah diunduh': 'Downloaded list', 'Reset semua penanda "diunduh"': 'Reset all "downloaded" marks',
    'Hapus daftar ({0})': 'Clear list ({0})', 'Daftar sudah kosong': 'The list is already empty',
    'Hapus daftar sudah diunduh?': 'Clear the downloaded list?',
    '{0} galeri akan kehilangan penanda. File hasil unduhan tidak ikut terhapus.': '{0} galleries will lose their mark. Downloaded files are not deleted.',
    'Hapus': 'Delete', 'Batal': 'Cancel', 'Daftar penanda dihapus': 'Downloaded marks cleared', '✓ Diunduh': '✓ Downloaded',
    // --- panel: lainnya, footer
    'Buka/tutup pengaturan': 'Open/close settings', 'Buka/tutup Filter Tag': 'Open/close Tag Filter',
    'Dump latar terang': 'Light-background dump', 'Salin daftar elemen berlatar putih (untuk dicek)': 'Copy a list of elements with white backgrounds (for debugging)',
    'Salin dump': 'Copy dump', 'Tersalin ✓': 'Copied ✓', 'Lihat console (F12)': 'See console (F12)',
    'Poster grid, mode gelap, reader webtoon, dan filter tag untuk hitomi.la': 'Poster grid, dark mode, webtoon reader and tag filter for hitomi.la',
    'Reset default': 'Reset to default', 'Reset semua pengaturan?': 'Reset all settings?',
    'Semua pengaturan dikembalikan ke nilai awal.': 'All settings will be restored to their defaults.', 'Reset': 'Reset',
    'Pengaturan dikembalikan ke default': 'Settings restored to default', 'Notifikasi akan muncul di sini': 'Notifications will appear here',
    'Buka/tutup: ': 'Open/close: ', 'Tutup (Esc)': 'Close (Esc)', 'Konfirmasi': 'Confirm',
    '⚙ Pengaturan': '⚙ Settings', 'Pengaturan (Alt+S)': 'Settings (Alt+S)',
    // --- filter tag
    'Filter Tag': 'Tag Filter', 'Filter Tag (Alt+T)': 'Tag Filter (Alt+T)', 'Sertakan': 'Include', 'Kecualikan': 'Exclude',
    'Cari tag… (mis. female:insect)': 'Search tags… (e.g. female:insect)', 'Bersihkan': 'Clear',
    'Tag belum dikenal. Pilih namespace di bawah (♀ / ♂ / tag).': 'Unknown tag. Pick a namespace below (♀ / ♂ / tag).',
    'Pilih mode di atas, klik tag di bawah, lalu tekan Cari. Hasilnya dari seluruh galeri, bukan hanya halaman ini.': 'Pick a mode above, click tags below, then press Search. Results come from all galleries, not just this page.',
    'Tambah tag baru': 'Add new tag', 'pilih jenisnya': 'choose its type', 'Tag di halaman ini': 'Tags on this page', 'Dari halaman lain': 'From other pages',
    'Kosongkan': 'Clear', '🔍 Cari': '🔍 Search', '🔍 Cari ({0})': '🔍 Search ({0})', 'Pilih tag dulu': 'Pick a tag first',
    'Tidak ada yang cocok di halaman ini.': 'No matches on this page.', 'Belum ada tag terbaca di halaman ini': 'No tags found on this page yet',
    '{0} tag': '{0} tag{1}', '{0} dari {1} (ketik untuk cari)': '{0} of {1} (type to search)',
    // --- kamus kanji
    'Memuat kamus kanji… (pertama kali agak lama, halaman tetap bisa dipakai)': 'Loading kanji dictionary… (slow the first time; the page stays usable)',
    'Gagal memuat kamus kanji ({0}). Kalau diblokir ekstensi pemblokir iklan, izinkan cdn.jsdelivr.net. Detail di Console, cari [HMT].': 'Failed to load the kanji dictionary ({0}). If an ad blocker is blocking it, allow cdn.jsdelivr.net. Details in the Console, search for [HMT].',
    'tidak diketahui': 'unknown', 'Kamus kanji siap': 'Kanji dictionary ready',
    'Gagal dimuat, klik untuk coba lagi': 'Failed to load, click to retry',
    // --- folder, antrian & panel pilih gambar
    'Pemilihan folder dibatalkan': 'Folder selection canceled', 'Tidak bisa mengakses folder: {0}': 'Cannot access the folder: {0}',
    'Pilih folder tujuan': 'Choose destination folder', 'Pilih folder': 'Choose folder',
    'Pilih atau buat SUBFOLDER sendiri (mis. Documents\\Hitomi). Browser menolak folder sistem seperti Downloads, Documents, atau Desktop langsung.': 'Pick or create your own SUBFOLDER (e.g. Documents\\Hitomi). The browser rejects system folders such as Downloads, Documents or Desktop directly.',
    'Izin ke folder sebelumnya tidak tersedia.': 'Permission for the previous folder is not available.', 'Belum ada folder tujuan.': 'No destination folder yet.',
    'Hapus yang sudah selesai / gagal': 'Remove finished / failed items', 'Ciutkan / buka': 'Collapse / expand', '{0} berjalan': '{0} running',
    'Batalkan unduhan?': 'Cancel the download?', 'Batalkan': 'Cancel download', 'Lanjutkan': 'Keep going', 'Simpan': 'Save',
    'Selesai: {0} → {1}': 'Done: {0} → {1}', 'Unduhan selesai, tinggal disimpan ke folder: {0}': 'Download finished, just save it to the folder: {0}',
    'gagal': 'failed', 'Gagal': 'Failed', 'Semua gambar gagal diproses (lihat console F12)': 'All images failed to process (see console, F12)',
    'Gagal menyimpan: {0}': 'Failed to save: {0}',
    'toBlob gagal': 'toBlob failed', 'tidak ada URL': 'no URL', 'kamus gagal diunduh ({0})': 'dictionary download failed ({0})', 'jaringan/CORS': 'network/CORS',
    'Menunggu antrian · {0} gambar': 'Queued · {0} images', 'Menyusun file…': 'Building file…', 'Mengunduh {0} / {1}': 'Downloading {0} / {1}',
    ' · konversi JPG': ' · JPG conversion', ' (gagal: {0})': ' (failed: {0})', 'Siap — klik Simpan untuk menulis ke folder': 'Ready — click Save to write to the folder',
    'Selesai ✓ → {0}': 'Done ✓ → {0}', ' di folder "{0}"': ' in folder "{0}"',
    'Pilih gambar untuk diunduh': 'Choose images to download', 'Pilih semua': 'Select all', 'Balik pilihan': 'Invert selection',
    'Klik = pilih/batal · Shift+klik = rentang': 'Click = select/deselect · Shift+click = range',
    'Ukuran': 'Size', 'Kualitas JPG': 'JPG quality', 'Format': 'Format', 'Asli': 'Original', 'Simpan ke': 'Save to', 'Hasil': 'Output', 'Folder': 'Folder',
    'Pilih folder…': 'Choose folder…', 'Tutup': 'Close',
    '{0} / {1} dipilih': '{0} / {1} selected', 'Simpan {0} ({1})': 'Save {0} ({1})', 'Unduh {0} ({1})': 'Download {0} ({1})',
    'Siap mengunduh {0} gambar · berjalan di latar belakang, boleh pindah halaman': 'Ready to download {0} images · runs in the background, you can change pages',
    'Belum ada gambar dipilih': 'No images selected',
    'Galeri ini sudah pernah diunduh ({0}).': 'This gallery was already downloaded ({0}).', 'Hapus tanda': 'Remove mark',
    'Gagal menambahkan ke antrian: {0}': 'Failed to add to the queue: {0}',
    'Ditambahkan ke antrian: {0} gambar. Boleh pindah halaman, unduhan tetap jalan.': 'Added to queue: {0} images. You can change pages; the download keeps running.',
  };
  function T(s, ...a) {
    if (typeof s !== 'string') return s;
    const r = state.lang === 'en' && Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s;
    return a.length ? r.replace(/\{(\d+)\}/g, (m, i) => (a[+i] != null ? a[+i] : m)) : r;
  }
  const tErr = (e) => { // pesan galat yang tersimpan/dibawa dari worker (bahasa Indonesia) -> bahasa aktif
    const x = String(e == null ? '' : e);
    let m = x.match(/^Gagal menyimpan: ([\s\S]*)$/); if (m) return T('Gagal menyimpan: {0}', m[1]);
    m = x.match(/^Error: ([\s\S]*)$/); if (m) return 'Error: ' + T(m[1]);
    m = x.match(/^kamus gagal diunduh \(([\s\S]*)\)$/); if (m) return T('kamus gagal diunduh ({0})', T(m[1]));
    return T(x);
  };
  const outName = (o) => T(o === 'pdf' ? 'PDF' : o === 'img' ? 'gambar' : 'ZIP');

  const isReader = location.pathname.startsWith('/reader/');
  const root = document.documentElement;
  let trimmed = false; // true setelah halaman siap: pagination bawah boleh tampil lagi
  const isGallery = !isReader && /^\/(doujinshi|manga|artistcg|gamecg|imageset|anime)\//.test(location.pathname);
  let thumbHost = null; // grid thumbnail besar buatan script
  let thumbOrig = null; // strip thumbnail asli situs (disembunyikan saat grid besar aktif)
  let navRO = null, navAttrMO = null, stk = [], stkRaf = 0, stkReady = false, stkBanTry = 0; // header tetap di atas (fixed + spacer); [{ el, sp, mt, mb }]
  let wtFailed = false; // true kalau webtoon gagal dibangun -> kembali ke reader asli

  /* ====================================================================
   * CSS
   * ==================================================================== */
  const css = `
  .hmt-hide { display: none !important; }
  /* pagination disembunyikan dulu sampai script memutuskan mana yang atas, supaya tidak muncul-hilang */
  html.hm-trim .page-container { visibility: hidden; }
  html.hm-dark { color-scheme: dark; }
  /* banner judul halaman ("Recently Added"): gelap sejak awal, tanpa menunggu deteksi JS */
  /* tanpa transisi: situs memberi transition pada latar, jadi saat digelapkan terlihat memudar dari terang -> kedip */
  html.hm-dark .hmt-banner, html.hm-dark .hmt-banner *, html.hm-dark .hmt-dk, html.hm-dark .navbar, html.hm-dark .navbar * { transition: none !important; }
  html.hm-dark .hmt-dk { background-color: #1a1a22 !important; color: #d6d6dc !important; border-color: #33334a !important; }
  /* ---------- GRID ---------- */
  html.hm-grid .container { width: 96% !important; max-width: 1900px !important; }
  html.hm-grid .gallery-content { display: none !important; }
  .hm-grid-wrap { display: none; }
  html.hm-grid .hm-grid-wrap {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--hm-card, 190px), 1fr));
    gap: 12px; padding: 12px; box-sizing: border-box; width: 100%;
  }
  .hm-card {
    position: relative; display: block; overflow: hidden; aspect-ratio: 3 / 4.2;
    border-radius: 8px; background: #1d1d27; border: 1px solid #33334a;
    text-decoration: none !important;
    transition: transform .15s, box-shadow .15s, border-color .15s;
  }
  .hm-card:hover { transform: translateY(-2px); border-color: var(--hm-ac, #6b8cff); box-shadow: 0 6px 18px rgba(0,0,0,.45); z-index: 2; }
  .hm-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .25s; }
  .hm-card:hover img { transform: scale(1.04); }
  .hm-tags {
    position: absolute; inset: 0; padding: 30px 8px 74px; box-sizing: border-box;
    display: flex; flex-wrap: wrap; align-content: flex-start; gap: 3px; overflow: hidden;
    background: rgba(10,10,18,.88); opacity: 0; transition: opacity .15s; pointer-events: none;
  }
  .hm-card:hover .hm-tags { opacity: 1; }
  .hm-tags span { font: 10px/1 sans-serif; padding: 3px 5px; border-radius: 3px; background: #3b3f5c; color: #e6e8ff; }
  .hm-badges { position: absolute; top: 6px; left: 6px; right: 6px; display: flex; justify-content: space-between; pointer-events: none; }
  .hm-badge { font: 700 10px/1 sans-serif; padding: 3px 5px; border-radius: 4px; background: rgba(0,0,0,.75); color: #fff; }
  .hm-ov {
    position: absolute; left: 0; right: 0; bottom: 0; padding: 30px 8px 7px;
    background: linear-gradient(transparent, rgba(0,0,0,.92)); pointer-events: none;
  }
  .hm-title {
    font: 700 12.5px/1.25 sans-serif; color: #fff; text-shadow: 0 1px 2px #000; word-break: break-word;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .hm-sub { font: 11px/1.3 sans-serif; color: var(--hm-act, #b9c4ff); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }


  /* ---------- KARTU DETAIL (cover kiri + tabel info kanan) ---------- */
  .hm-cover { position: absolute; inset: 0; overflow: hidden; }
  .hm-info { display: none; }
  html.hm-dt .hm-grid-wrap { grid-template-columns: repeat(auto-fill, minmax(calc(var(--hm-card, 190px) * 2.3), 1fr)); }
  html.hm-dt .hm-card { display: flex; align-items: stretch; aspect-ratio: auto; background: #1a1a22; }
  html.hm-dt .hm-cover { position: relative; inset: auto; flex: 0 0 calc(var(--hm-card, 190px) * .78); aspect-ratio: 3 / 4.2; }
  html.hm-dt .hm-cover .hm-tags, html.hm-dt .hm-cover .hm-ov, html.hm-dt .hm-cover .hm-badges { display: none !important; }
  html.hm-dt .hm-info { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; overflow: hidden; }
  html.hm-dt .hm-it { padding: 8px 10px; background: var(--tc, #4a3340); color: #fff; font: 700 15px/1.25 sans-serif; word-break: break-word; flex: 0 0 auto; }
  html.hm-dt .hm-ia { flex: 0 0 auto; padding: 4px 10px; background: var(--ta, #33252f); color: var(--tt, #ffb3c8); font: 700 13px/1.3 sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  html.hm-dt .hm-rows { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 5px 14px; padding: 9px 10px; font: 12px/1.35 sans-serif; align-content: start; flex: 1 1 0; min-height: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: #4a4e70 transparent; overscroll-behavior: contain; }
  html.hm-dt .hm-k { font-weight: 700; color: #fff; }
  html.hm-dt .hm-v { color: #cfcfd8; word-break: break-word; }
  /* ---------- WARNA PER TYPE: --tc = bar judul, --ta = bar artis, --tt = teks aksen ---------- */
  .hm-card[data-type="doujinshi"] { --tc: #4a3340; --ta: #33252f; --tt: #ffb3c8; }
  .hm-card[data-type="manga"]     { --tc: #2d4a73; --ta: #213552; --tt: #9fc8ff; }
  .hm-card[data-type="imageset"]  { --tc: #2c5c4c; --ta: #1f4136; --tt: #8fe8c3; }
  .hm-card[data-type="artistcg"]  { --tc: #5b3a78; --ta: #3f2756; --tt: #d9aaff; }
  .hm-card[data-type="gamecg"]    { --tc: #6a4f22; --ta: #4a3817; --tt: #ffd277; }
  .hm-card[data-type="anime"]     { --tc: #2b5a63; --ta: #1e4047; --tt: #8fe3f0; }
  .hm-card[data-type] .hm-vtype { display: inline-block; justify-self: start; padding: 2px 8px; border-radius: 10px; font-weight: 700; background: var(--tc); color: var(--tt); box-shadow: inset 0 0 0 1px var(--tt); }
  .hm-card[data-type] .hm-badge:last-child { background: var(--tc); color: var(--tt); box-shadow: inset 0 0 0 1px var(--tt); }
  html.hm-dt .hm-chips { display: flex; flex-wrap: wrap; gap: 4px; }
  html.hm-dt .hm-chips span { font: 700 11px/1 sans-serif; padding: 4px 7px; border-radius: 4px; background: #3d4059; color: #e4e6ff; }
  html.hm-dt .hm-done { left: auto; right: 6px; top: 6px; }

  /* ---------- INTRO KARTU: kartu disembunyikan sebentar, lalu diputar animasinya satu per satu (lihat introWatch) ---------- */
  html.hmt-pre .hm-card, html.hmt-pre .hm-th { opacity: 0 !important; }
  [data-hmt-sr] { opacity: 0 !important; } /* menunggu masuk layar (animasi saat di-scroll) */
  html.hmt-pre-blk .cover-column, html.hmt-pre-blk .dj-gallery, html.hmt-pre-blk #gallery-brand, html.hmt-pre-blk .gallery-info { opacity: 0 !important; }
  html.hmt-pre-nav .navbar, html.hmt-pre-bn .hmt-banner:not(.navbar), html.hmt-pre-bn .list-title { opacity: 0 !important; }
  html.hmt-pre-navi .navbar *, html.hmt-pre-bni .hmt-banner:not(.navbar) *, html.hmt-pre-bni .list-title * { opacity: 0 !important; }

  /* ---------- DARK ---------- */
  html.hm-dark, html.hm-dark body { background: #14141a !important; color: #d6d6dc !important; }
  html.hm-dark .container, html.hm-dark .content, html.hm-dark .top-content,
  html.hm-dark .page-container, html.hm-dark .bottom-content,
  html.hm-dark .dj-gallery, html.hm-dark .cover-column {
    background: #14141a !important; color: #d6d6dc !important;
  }
  html.hm-dark td, html.hm-dark th, html.hm-dark .dj-content, html.hm-dark .dj-desc,
  html.hm-dark .gallery-info, html.hm-dark .gallery-info * { color: #cfcfd8 !important; }
  html.hm-dark h1, html.hm-dark h2 { color: #fff !important; }
  html.hm-dark a { color: #8fb0ff; }
  /* navbar tetap putih */
  html.hm-dark .navbar a, html.hm-dark .navbar-inner a, html.hm-dark .drop-button a { color: #fff !important; }
  html.hm-dark #lang-list { background: #22222e !important; }
  html.hm-dark #lang-list a { color: #ddd !important; }
  html.hm-dark #search-suggestions, html.hm-dark #search-suggestions * { background: #22222e !important; color: #ddd !important; }
  /* header judul gallery */
  html.hm-dark #gallery-brand { background: #4a3340 !important; }
  html.hm-dark #gallery-brand, html.hm-dark #gallery-brand a { color: #fff !important; }
  html.hm-dark #artists { background: #33252f !important; }
  html.hm-dark #artists a { color: #ffb3c8 !important; }
  /* tag chip */
  html.hm-dark .tags a { background: #3d4059 !important; color: #e4e6ff !important; }
  /* area thumbnail */
  html.hm-dark .gallery-preview, html.hm-dark .gallery-preview div { background: #1a1a22 !important; border-color: #33334a !important; }
  html.hm-dark .gallery-preview img { opacity: .9; }
  html.hm-dark .page-container li, html.hm-dark .page-container li a { color: #aab !important; background: transparent !important; }
  html.hm-dark input, html.hm-dark select { background: #2a2a36 !important; color: #ddd !important; border: 1px solid #444 !important; }

  /* ---------- NAVBAR FIX + HAPUS GLOW PUTIH ---------- */
  html.hm-grid .navbar { width: auto !important; max-width: none !important; }
  html.hm-dark body, html.hm-dark .container, html.hm-dark .content, html.hm-dark .top-content,
  html.hm-dark .page-container, html.hm-dark .bottom-content, html.hm-dark .dj-gallery,
  html.hm-dark .cover-column, html.hm-dark .gallery-content, html.hm-dark .navbar, html.hm-dark .navbar-inner {
    box-shadow: none !important; -webkit-box-shadow: none !important; filter: none !important;
  }
  html.hm-dark .container, html.hm-dark .content { border-color: transparent !important; }
  #hmt-nav a { cursor: pointer; }

  /* ---------- THUMBNAIL BESAR + HOVER PREVIEW ---------- */
  .hm-thumbs { display: none; }
  html.hm-thumbs-on .hm-thumbs {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--hm-tw, 160px), 1fr));
    gap: 10px; padding: 10px; align-items: start; box-sizing: border-box; width: 100%;
  }
  .hm-th { position: relative; display: block; line-height: 0; overflow: hidden; border-radius: 6px;
    background: #1d1d27; border: 1px solid #33334a; transition: border-color .12s; }
  .hm-th:hover { border-color: var(--hm-ac, #6b8cff); }
  .hm-th img { display: block; width: 100%; height: auto; background: #1a1a22; }
  .hm-thn { position: absolute; left: 6px; bottom: 6px; padding: 2px 6px; border-radius: 4px;
    background: rgba(0,0,0,.72); color: #fff; font: 700 11px/1.3 sans-serif; pointer-events: none; }
  #hmt-preview { position: fixed; left: 0; top: 0; z-index: 99998; display: none; pointer-events: none; line-height: 0;
    background: #0c0c10; border: 1px solid #33334a; border-radius: 8px; overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,.6); will-change: transform; }
  #hmt-preview img { display: block; max-width: none !important; }
  .hmt-pv-n { position: absolute; left: 8px; bottom: 8px; padding: 2px 7px; border-radius: 5px;
    background: rgba(0,0,0,.72); color: #fff; font: 700 12px/1.3 sans-serif; }

  /* ---------- PANEL PENGATURAN ---------- */
  #hmt-overlay { position: fixed; inset: 0; z-index: 100000; display: none; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box;
    background: rgba(8,8,14,.72); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); transition: background-color .25s; }
  #hmt-overlay.open { display: flex; animation: hmt-fade .16s ease-out; }
  #hmt-overlay.open #hmt-panel { animation: hmt-pop .22s cubic-bezier(.22, 1, .36, 1); }
  #hmt-overlay.hmt-still, #hmt-overlay.hmt-still #hmt-panel { animation: none !important; }
  @keyframes hmt-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes hmt-pop { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { #hmt-overlay.open, #hmt-overlay.open #hmt-panel { animation: none; } }
  #hmt-overlay.hmt-pv { background: rgba(8,8,14,0) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }

  #hmt-panel { --p-card: #1f1f2b; --p-line: #2c2c3e; --p-mut: #8d8da8;
    width: min(840px, 100%); height: min(600px, 100%); display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box;
    background: #171720; color: #e8e8f2; border: 1px solid #2f2f44; border-radius: 16px;
    box-shadow: 0 28px 80px rgba(0,0,0,.7); font: 14px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif; text-align: left; }
  #hmt-panel *, #hmt-panel *::before, #hmt-panel *::after { box-sizing: border-box; }
  #hmt-panel button { all: unset; box-sizing: border-box; cursor: pointer; }
  #hmt-panel button:focus-visible, #hmt-panel .hmt-sel:focus-visible { outline: 2px solid var(--hm-ac, #5b7cff); outline-offset: 2px; }

  /* kepala */
  #hmt-panel .hmt-head { flex: none; display: flex; align-items: center; gap: 12px; padding: 14px 16px 14px 18px; border-bottom: 1px solid var(--p-line);
    background: linear-gradient(180deg, #1e1e2a, #171720); }
  #hmt-panel .hmt-logo { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; font-size: 18px; color: #fff;
    background: var(--hm-acbg, #2c3050); box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }
  #hmt-panel .hmt-ttl { flex: 1; min-width: 0; }
  #hmt-panel .hmt-title { font-size: 16px; font-weight: 700; color: #fff; line-height: 1.2; }
  #hmt-panel .hmt-sub { margin-top: 2px; font-size: 12px; color: var(--p-mut); letter-spacing: .02em; }
  #hmt-panel .hmt-sub b { color: var(--hm-act, #b9c4ff); font-weight: 700; }
  #hmt-panel .hmt-close { flex: none; width: 32px; height: 32px; border-radius: 9px; text-align: center; line-height: 32px; font-size: 16px; color: #9a9ab5; }
  #hmt-panel .hmt-close:hover { background: #2a2a3b; color: #fff; }

  /* badan: menu kiri + isi */
  #hmt-panel .hmt-body { flex: 1; min-height: 0; display: flex; }
  #hmt-panel .hmt-nav { flex: none; width: 184px; padding: 12px 10px; border-right: 1px solid var(--p-line); background: #14141b;
    display: flex; flex-direction: column; gap: 3px; overflow-y: auto; scrollbar-width: thin; }
  #hmt-panel .hmt-tab { position: relative; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; color: #9a9ab5; font-weight: 600; font-size: 13px; transition: background .12s, color .12s; }
  #hmt-panel .hmt-tab:hover { background: #20202e; color: #fff; }
  #hmt-panel .hmt-tab.on { background: var(--hm-acbg, #2c3050); color: #fff; }
  #hmt-panel .hmt-tab.on::before { content: ''; position: absolute; left: -10px; top: 9px; bottom: 9px; width: 3px; border-radius: 0 3px 3px 0; background: var(--hm-ac, #5b7cff); }
  #hmt-panel .hmt-ic { flex: none; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 8px; background: rgba(255,255,255,.06); font-size: 14px; line-height: 1; }
  #hmt-panel .hmt-tab.on .hmt-ic { background: rgba(255,255,255,.12); }
  #hmt-panel .hmt-pane { display: none; flex: 1; min-width: 0; overflow-y: auto; padding: 14px 20px 22px; scrollbar-width: thin; scrollbar-color: #3a3a50 transparent; }
  #hmt-panel .hmt-pane.on { display: block; }

  /* bagian & baris */
  #hmt-panel .hmt-sec { margin: 20px 4px 8px; font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #7f86b8; }
  #hmt-panel .hmt-pane > .hmt-sec:first-child { margin-top: 2px; }
  #hmt-panel .hmt-grp { background: var(--p-card); border: 1px solid var(--p-line); border-radius: 12px; overflow: hidden; }
  #hmt-panel .hmt-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; transition: opacity .15s; }
  #hmt-panel .hmt-row + .hmt-row { border-top: 1px solid var(--p-line); }
  #hmt-panel .hmt-row.col { flex-direction: column; align-items: stretch; gap: 8px; }
  #hmt-panel .hmt-row.hmt-clk { cursor: pointer; }
  #hmt-panel .hmt-row.hmt-clk:hover { background: rgba(255,255,255,.025); }
  #hmt-panel .hmt-row.hmt-dis { opacity: .4; pointer-events: none; }
  #hmt-panel .hmt-txt { flex: 1; min-width: 0; }
  #hmt-panel .hmt-lbl { color: #ececf5; font-weight: 600; }
  #hmt-panel .hmt-desc { color: var(--p-mut); font-size: 12px; margin-top: 2px; line-height: 1.4; }

  /* kontrol */
  #hmt-panel .hmt-sw { position: relative; flex: none; width: 42px; height: 24px; border-radius: 12px; background: #3a3a50; transition: background .18s; }
  #hmt-panel .hmt-sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .18s; }
  #hmt-panel .hmt-sw[aria-checked="true"] { background: var(--hm-ac, #5b7cff); }
  #hmt-panel .hmt-sw[aria-checked="true"]::after { transform: translateX(18px); }
  #hmt-panel .hmt-rangebox { flex: none; width: 230px; display: flex; align-items: center; gap: 12px; }
  #hmt-panel input.hmt-range { -webkit-appearance: none; appearance: none; flex: 1; height: 6px; border-radius: 3px; padding: 0; margin: 0; background: #3a3a50 !important; border: 0 !important; outline: none; }
  #hmt-panel input.hmt-range::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--hm-ac, #5b7cff); border: 2px solid #fff; cursor: pointer; }
  #hmt-panel input.hmt-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--hm-ac, #5b7cff); border: 2px solid #fff; cursor: pointer; }
  #hmt-panel .hmt-val { min-width: 56px; text-align: right; color: var(--hm-act, #b9c4ff); font-variant-numeric: tabular-nums; font-weight: 600; }
  #hmt-panel .hmt-seg { flex: none; width: 230px; display: flex; gap: 3px; padding: 3px; border-radius: 10px; background: #12121a; border: 1px solid var(--p-line); }
  #hmt-panel .hmt-seg button { flex: 1; text-align: center; padding: 6px 4px; border-radius: 7px; color: #9a9ab5; font-weight: 600; font-size: 12.5px; white-space: nowrap; }
  #hmt-panel .hmt-seg button:hover { color: #fff; }
  #hmt-panel .hmt-seg button.on { background: var(--hm-ac, #5b7cff); color: #fff; }
  #hmt-panel .hmt-sel { flex: none; width: 230px; padding: 8px 10px; border-radius: 9px; border: 1px solid #33334a; background: #12121a; color: #e6e6f0; font-family: inherit; font-size: 13px; font-weight: 600; line-height: 1.2; cursor: pointer; outline: none; }
  #hmt-panel .hmt-sel:focus { border-color: var(--hm-ac, #5b7cff); }
  #hmt-panel .hmt-sel option { background: #14141c; color: #e6e6f0; }
  #hmt-panel .hmt-reset { display: inline-block; padding: 7px 13px; border-radius: 8px; background: #2a2a3b; color: #ddd; font-weight: 600; font-size: 12px; white-space: nowrap; text-align: center; }
  #hmt-panel .hmt-reset:hover { background: #3a3a52; color: #fff; }
  #hmt-panel .hmt-reset.warn:hover { background: #4b2733; color: #ffc0cc; }
  #hmt-panel kbd { font: 11px/1 ui-monospace, monospace; padding: 3px 6px; border-radius: 5px; background: #12121a; border: 1px solid #33334a; color: var(--hm-act, #b9c4ff); }
  #hmt-panel .hmt-badge { flex: none; padding: 5px 11px; border-radius: 999px; background: var(--hm-acbg, #2c3050); color: #fff; font-size: 12px; font-weight: 600; }
  #hmt-panel .hmt-badge b { color: var(--hm-act, #b9c4ff); }

  /* kaki */
  #hmt-panel .hmt-foot { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; border-top: 1px solid var(--p-line); background: #14141b; color: #7a7a95; font-size: 12px; }

  /* layar kecil */
  @media (max-width: 600px) {
    #hmt-overlay { padding: 8px; }
    #hmt-panel { height: 100%; }
    #hmt-panel .hmt-body { flex-direction: column; }
    #hmt-panel .hmt-nav { width: auto; flex-direction: row; border-right: 0; border-bottom: 1px solid var(--p-line); padding: 8px; overflow-x: auto; overflow-y: hidden; }
    #hmt-panel .hmt-tab { padding: 7px 10px; white-space: nowrap; }
    #hmt-panel .hmt-tab.on::before { display: none; }
    #hmt-panel .hmt-pane { padding: 12px 12px 18px; }
    #hmt-panel .hmt-row { flex-wrap: wrap; }
    #hmt-panel .hmt-rangebox, #hmt-panel .hmt-seg, #hmt-panel .hmt-sel { width: 100%; min-width: 0; }
  }
  #hmt-fab { position: fixed; right: 10px; bottom: 10px; z-index: 99999; width: 34px; height: 34px; border-radius: 50%; border: 1px solid #444; background: #222; color: #fff; cursor: pointer; opacity: .5; padding: 0; font-size: 16px; }
  #hmt-fab:hover { opacity: 1; }

  /* ---------- READER / WEBTOON ---------- */
  html.hm-webtoon { overflow-x: hidden !important; overflow-y: auto !important; height: auto !important; background: #0c0c10 !important; }
  html.hm-webtoon body { overflow: visible !important; height: auto !important; min-height: 100vh; background: #0c0c10 !important; }
  html.hm-webtoon #comicImages, html.hm-webtoon #mobileImages,
  html.hm-webtoon #preload, html.hm-webtoon #postload { display: none !important; }
  html.hm-webtoon .navbar-static-top { position: sticky !important; top: 0; z-index: 1000; }
  /* header tetap di atas saat scroll */
  .hmt-nav-fixed { position: fixed !important; z-index: 1000 !important; margin: 0 !important; box-sizing: border-box; background: #fff; }
  .hmt-banner.hmt-nav-fixed { z-index: 999 !important; }
  /* navbar + banner judul disembunyikan sampai posisi tetapnya siap (tidak ada loncat/kedip saat halaman dimuat) */
  html.hm-sticky:not(.hmt-ready) .navbar, html.hm-sticky:not(.hmt-ready) .container *:has(select):not(:has(.navbar, .gallery-content, .hm-grid-wrap, .page-container, .gallery-preview)):not(.navbar *):not(.gallery-content *):not(.hm-grid-wrap *) { visibility: hidden !important; }
  html.hm-dark .navbar, html.hm-dark .navbar-inner { background-color: #14141a !important; background-image: none !important; }
  html.hm-dark .hmt-nav-fixed, html.hm-dark .hmt-banner.hmt-nav-fixed { background: #14141a !important; background-image: none !important; }
  /* banner judul: polos seperti navbar, satu baris */
  .hmt-banner.hmt-nav-fixed { background-image: none !important; display: flex !important; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 12px !important; min-height: 40px; height: auto !important; overflow: visible !important; }
  .hmt-banner.hmt-nav-fixed .hmt-bt, .hmt-banner.hmt-nav-fixed :is(h1, h2, h3, h4) { position: static !important; float: none !important; transform: none !important; margin: 0 !important; padding: 0 !important; font-size: 22px !important; line-height: 1.2 !important; text-shadow: none !important; display: block; white-space: nowrap; }
  .hmt-banner.hmt-nav-fixed .hmt-bt:has(~ *), .hmt-banner.hmt-nav-fixed :is(h1, h2, h3, h4):has(~ *) { flex: 1 1 auto; }
  .hmt-banner.hmt-nav-fixed select { float: none !important; position: static !important; margin: 0 !important; }
  html.hm-webtoon li:has(> #nextPanel), html.hm-webtoon li:has(> #prevPanel),
  html.hm-webtoon li:has(> #fitVertical), html.hm-webtoon li:has(> #fitHorizontal),
  html.hm-webtoon li:has(> #fullSpread), html.hm-webtoon li:has(> #singlePage),
  html.hm-webtoon li:has(> #offsetPage) { display: none !important; }
  html:not(.hm-webtoon) #wt-container, html:not(.hm-webtoon) #wt-counter { display: none !important; }
  #wt-container { display: flex; flex-direction: column; align-items: center; width: 100%; padding: 0 0 80px; }
  #wt-container img { display: block; width: var(--hm-rw, 800px); max-width: 100%; height: auto; margin: 0; background: #1a1a22; }
  #wt-container img.wt-fail { min-height: 220px; outline: 2px dashed #a44; cursor: pointer; }
  #wt-counter { position: fixed; left: 10px; bottom: 10px; z-index: 99999; background: rgba(0,0,0,.7); color: #fff; padding: 4px 10px; border-radius: 12px; font: 13px sans-serif; }

  /* ---------- PANEL PILIH UNDUHAN (tanpa backdrop: situs di belakang tetap bisa dipakai) ---------- */
  #hmt-dl { position: fixed; inset: 0; z-index: 100001; pointer-events: none; color: #e6e6f0; text-align: left;
    font: 14px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  #hmt-dl *, #hmt-dl *::before, #hmt-dl *::after { box-sizing: border-box; }
  #hmt-dl button { all: unset; box-sizing: border-box; cursor: pointer; }
  #hmt-dl .dl-box { position: fixed; pointer-events: auto; max-width: 100vw; max-height: 100vh; display: flex; flex-direction: column;
    background: #1b1b25; border: 1px solid #33334a; border-radius: 16px; box-shadow: 0 24px 70px rgba(0,0,0,.65); overflow: hidden; }
  #hmt-dl .dl-box.min { height: auto !important; min-height: 0 !important; }
  #hmt-dl .dl-box.min .dl-bar, #hmt-dl .dl-box.min .dl-grid, #hmt-dl .dl-box.min .dl-foot, #hmt-dl .dl-box.min .dl-rs { display: none !important; }
  #hmt-dl .dl-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-bottom: 1px solid #2b2b3b;
    cursor: move; user-select: none; touch-action: none; }
  #hmt-dl .dl-title { font-size: 17px; font-weight: 700; color: #fff; }
  #hmt-dl .dl-sub { font-size: 12px; color: #8b8ba6; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #hmt-dl .dl-hb { display: flex; gap: 4px; flex: none; }
  #hmt-dl .dl-x { flex: none; width: 30px; height: 30px; border-radius: 8px; text-align: center; line-height: 30px; font-size: 18px; color: #9a9ab5; }
  #hmt-dl .dl-x:hover { background: #2a2a3b; color: #fff; }
  #hmt-dl .dl-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; padding: 10px 18px; border-bottom: 1px solid #2b2b3b; }
  #hmt-dl .dl-btn { padding: 7px 12px; border-radius: 8px; background: #2a2a3b; color: #ddd; font-weight: 600; font-size: 12px; }
  #hmt-dl .dl-btn:hover { background: #3a3a52; color: #fff; }
  #hmt-dl .dl-btn.pri { background: var(--hm-ac, #5b7cff); color: #fff; font-size: 13px; padding: 9px 20px; }
  #hmt-dl .dl-btn.pri:hover { background: var(--hm-ac2, #6f8cff); }
  #hmt-dl .dl-btn.off { opacity: .4; pointer-events: none; }
  #hmt-dl .dl-lbl { font-size: 12px; font-weight: 600; color: #8b8ba6; margin-left: 6px; }
  #hmt-dl .dl-seg { display: flex; gap: 3px; padding: 3px; border-radius: 9px; background: #14141c; }
  #hmt-dl .dl-seg button { padding: 5px 12px; border-radius: 6px; color: #9a9ab5; font-weight: 600; font-size: 12px; }
  #hmt-dl .dl-seg button:hover { color: #fff; }
  #hmt-dl .dl-seg button.on { background: var(--hm-ac, #5b7cff); color: #fff; }
  #hmt-dl .dl-q { display: flex; align-items: center; gap: 8px; }
  #hmt-dl .dl-q input { -webkit-appearance: none; appearance: none; width: 110px; height: 6px; border-radius: 3px; padding: 0; margin: 0; background: #3a3a50 !important; border: 0 !important; outline: none; cursor: pointer; }
  #hmt-dl .dl-q input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--hm-ac, #5b7cff); border: 2px solid #fff; }
  #hmt-dl .dl-q input::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--hm-ac, #5b7cff); border: 2px solid #fff; }
  #hmt-dl .dl-q span { min-width: 38px; color: var(--hm-act, #b9c4ff); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
  #hmt-dl .dl-hide { display: none !important; }
  #hmt-dl .dl-folder { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #hmt-dl .dl-count { margin-left: auto; color: var(--hm-act, #b9c4ff); font-weight: 600; font-variant-numeric: tabular-nums; }
  #hmt-dl .dl-hint { font-size: 11px; color: #7a7a95; }
  /* spasi pakai padding pada .dl-item (bukan gap), supaya tidak bisa ditimpa CSS situs */
  #hmt-dl .dl-grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; gap: 0;
    grid-template-columns: repeat(auto-fill, minmax(var(--dl-th, 150px), 1fr)); grid-auto-rows: max-content;
    padding: 12px 14px 20px; align-content: start; }
  #hmt-dl .dl-item { padding: 9px; cursor: pointer; user-select: none; }
  #hmt-dl .dl-cell { position: relative; aspect-ratio: 3 / 4.2; border-radius: 10px; overflow: hidden; border: 2px solid #33334a;
    background: #14141c; box-shadow: 0 3px 10px rgba(0,0,0,.35); transition: border-color .12s, transform .12s; }
  #hmt-dl .dl-item:hover .dl-cell { transform: translateY(-2px); }
  #hmt-dl .dl-cell img { display: block; width: 100%; height: 100%; object-fit: contain; transition: opacity .12s, filter .12s; pointer-events: none; }
  #hmt-dl .dl-cell.on { border-color: var(--hm-ac, #5b7cff); }
  #hmt-dl .dl-cell.off img { opacity: .28; filter: grayscale(1); }
  #hmt-dl .dl-n { position: absolute; left: 6px; bottom: 6px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.72); color: #fff; font: 700 11px/1.3 sans-serif; }
  #hmt-dl .dl-ck { position: absolute; right: 6px; top: 6px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,.6);
    border: 2px solid #fff; color: #fff; font: 700 12px/18px sans-serif; text-align: center; }
  #hmt-dl .dl-cell.on .dl-ck { background: var(--hm-ac, #5b7cff); border-color: var(--hm-ac, #5b7cff); }
  #hmt-dl .dl-foot { display: flex; align-items: center; gap: 14px; padding: 12px 18px; border-top: 1px solid #2b2b3b; }
  #hmt-dl .dl-stat { flex: 1; min-width: 0; font-size: 12px; color: #8b8ba6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* handle resize di semua tepi & sudut */
  #hmt-dl .dl-rs { position: absolute; z-index: 6; touch-action: none; }
  #hmt-dl .dl-rs-n { top: 0; left: 14px; right: 14px; height: 6px; cursor: ns-resize; }
  #hmt-dl .dl-rs-s { bottom: 0; left: 14px; right: 14px; height: 6px; cursor: ns-resize; }
  #hmt-dl .dl-rs-e { right: 0; top: 14px; bottom: 14px; width: 6px; cursor: ew-resize; }
  #hmt-dl .dl-rs-w { left: 0; top: 14px; bottom: 14px; width: 6px; cursor: ew-resize; }
  #hmt-dl .dl-rs-ne { top: 0; right: 0; width: 14px; height: 14px; cursor: nesw-resize; }
  #hmt-dl .dl-rs-nw { top: 0; left: 0; width: 14px; height: 14px; cursor: nwse-resize; }
  #hmt-dl .dl-rs-se { bottom: 0; right: 0; width: 16px; height: 16px; cursor: nwse-resize; }
  #hmt-dl .dl-rs-sw { bottom: 0; left: 0; width: 14px; height: 14px; cursor: nesw-resize; }

  /* ---------- WIDGET ANTRIAN UNDUHAN (tetap tampil di semua halaman) ---------- */
  #hmt-dm { position: fixed; right: 16px; bottom: 16px; width: 340px; max-width: calc(100vw - 16px); z-index: 100002;
    background: #1b1b25; color: #e6e6f0; border: 1px solid #33334a; border-radius: 12px; overflow: hidden; text-align: left;
    box-shadow: 0 14px 40px rgba(0,0,0,.55); font: 13px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  #hmt-dm *, #hmt-dm *::before, #hmt-dm *::after { box-sizing: border-box; }
  #hmt-dm.hide { display: none !important; }
  #hmt-dm button { all: unset; box-sizing: border-box; cursor: pointer; }
  #hmt-dm .dm-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 12px; background: #20202c;
    font-weight: 700; cursor: move; user-select: none; touch-action: none; }
  #hmt-dm .dm-hb { display: flex; gap: 2px; }
  #hmt-dm .dm-hb button { padding: 2px 8px; border-radius: 6px; color: #9a9ab5; font-size: 12px; font-weight: 600; }
  #hmt-dm .dm-hb button:hover { background: #2f2f44; color: #fff; }
  #hmt-dm .dm-body { max-height: 46vh; overflow-y: auto; padding: 2px 12px 8px; }
  #hmt-dm.min .dm-body { display: none; }
  #hmt-dm .dm-job { padding: 10px 0; border-top: 1px solid #2b2b3b; }
  #hmt-dm .dm-job:first-child { border-top: 0; }
  #hmt-dm .dm-t { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #hmt-dm .dm-s { font-size: 12px; color: #8b8ba6; margin: 2px 0 7px; }
  #hmt-dm .dm-track { height: 6px; border-radius: 3px; background: #3a3a50; overflow: hidden; }
  #hmt-dm .dm-fill { height: 100%; width: 0; background: var(--hm-ac, #5b7cff); transition: width .25s; }
  #hmt-dm .dm-job.done .dm-fill, #hmt-dm .dm-job.ready .dm-fill { background: #3ecf8e; }
  #hmt-dm .dm-job.error .dm-fill { background: #ff6b6b; }
  #hmt-dm .dm-a { display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end; }
  #hmt-dm .dm-a button { padding: 4px 11px; border-radius: 7px; background: #2a2a3b; color: #ddd; font-size: 12px; font-weight: 600; }
  #hmt-dm .dm-a button:hover { background: #3a3a52; color: #fff; }
  #hmt-dm .dm-a button.pri { background: var(--hm-ac, #5b7cff); color: #fff; }

  /* ---------- NOTIFIKASI (toast) & KONFIRMASI buatan sendiri ---------- */
  #hmt-toasts { position: fixed; z-index: 100010; display: flex; flex-direction: column;
    gap: 8px; align-items: stretch; pointer-events: none; width: min(420px, calc(100vw - 24px)); }
  /* posisi notifikasi (diatur di Pengaturan > Tampilan). bawah-kanan diberi jarak supaya tidak menimpa tombol ⚙ */
  #hmt-toasts, html[data-hmt-tp="br"] #hmt-toasts { right: 14px; bottom: 56px; left: auto; top: auto; transform: none; }
  html[data-hmt-tp="bl"] #hmt-toasts { left: 14px; bottom: 22px; right: auto; top: auto; transform: none; }
  html[data-hmt-tp="bc"] #hmt-toasts { left: 50%; bottom: 22px; right: auto; top: auto; transform: translateX(-50%); }
  html[data-hmt-tp="tr"] #hmt-toasts { right: 14px; top: 96px; left: auto; bottom: auto; transform: none; }
  html[data-hmt-tp="tl"] #hmt-toasts { left: 14px; top: 96px; right: auto; bottom: auto; transform: none; }
  html[data-hmt-tp="tc"] #hmt-toasts { left: 50%; top: 96px; right: auto; bottom: auto; transform: translateX(-50%); }
  .hmt-toast { pointer-events: auto; display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 12px 11px 14px; border-radius: 12px;
    background: #20202c; color: #eceef8; border: 1px solid #3a3a52; border-left: 4px solid var(--hm-ac, #5b7cff); box-shadow: 0 10px 30px rgba(0,0,0,.5);
    font: 13px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif; text-align: left; animation: hmt-in .18s ease-out; }
  .hmt-toast.ok { border-left-color: #3ecf8e; }
  .hmt-toast.err { border-left-color: #ff6b6b; }
  .hmt-toast.out { opacity: 0; transform: translateY(8px); transition: opacity .18s, transform .18s; }
  .hmt-toast .t-ico { flex: none; font-weight: 700; }
  .hmt-toast.ok .t-ico { color: #3ecf8e; } .hmt-toast.err .t-ico { color: #ff6b6b; } .hmt-toast.info .t-ico { color: var(--hm-act, #8fa5ff); }
  .hmt-toast .t-msg { flex: 1; min-width: 0; word-break: break-word; }
  .hmt-toast button { all: unset; box-sizing: border-box; cursor: pointer; padding: 4px 10px; border-radius: 7px; background: #2a2a3b; color: #ddd; font-weight: 600; font-size: 12px; }
  .hmt-toast button:hover { background: #3a3a52; color: #fff; }
  .hmt-toast button.pri { background: var(--hm-ac, #5b7cff); color: #fff; }
  .hmt-toast button.x { padding: 2px 7px; color: #8b8ba6; font-size: 14px; background: transparent; }
  @keyframes hmt-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  #hmt-modal { position: fixed; inset: 0; z-index: 100020; display: flex; align-items: center; justify-content: center; background: rgba(8,8,14,.6);
    font: 14px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif; text-align: left; }
  #hmt-modal .m-box { width: min(380px, calc(100vw - 32px)); padding: 20px; border-radius: 14px; background: #1b1b25; color: #e6e6f0;
    border: 1px solid #33334a; box-shadow: 0 24px 70px rgba(0,0,0,.6); animation: hmt-in .15s ease-out; }
  #hmt-modal .m-title { font-size: 16px; font-weight: 700; color: #fff; }
  #hmt-modal .m-text { margin-top: 6px; color: #a9a9c2; font-size: 13px; word-break: break-word; }
  #hmt-modal .m-act { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
  #hmt-modal button { all: unset; box-sizing: border-box; cursor: pointer; padding: 8px 16px; border-radius: 8px; background: #2a2a3b; color: #ddd; font-weight: 600; font-size: 13px; }
  #hmt-modal button:hover { background: #3a3a52; color: #fff; }
  #hmt-modal button.pri { background: var(--hm-ac, #5b7cff); color: #fff; }
  #hmt-modal button.danger { background: #e5484d; color: #fff; }
  /* kolom search diperpanjang */
  html.hm-search .header-table { width: min(var(--hm-sw, 520px), 100%) !important; max-width: none !important; }
  html.hm-search .header-table .search-input, html.hm-search #search { flex: 1 1 auto; }
  html.hm-search #query-input { width: 100% !important; }
  /* pilihan warna aksen */
  #hmt-panel .hmt-acc { flex: none; display: flex; align-items: center; gap: 9px; }
  #hmt-panel .hmt-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; box-shadow: 0 0 0 1px rgba(0,0,0,.5); transition: transform .12s; }
  #hmt-panel .hmt-dot:hover { transform: scale(1.15); }
  #hmt-panel .hmt-dot.on { border-color: #fff; }
  #hmt-panel input.hmt-color { width: 30px; height: 26px; padding: 0; margin: 0; border: 0; background: none; cursor: pointer; }
  /* penanda sudah diunduh */
  .hm-done { position: absolute; left: 6px; top: 27px; padding: 3px 6px; border-radius: 4px; pointer-events: none;
    background: var(--hm-ac, #5b7cff); color: #fff; font: 700 10px/1 sans-serif; box-shadow: 0 1px 4px rgba(0,0,0,.5); }
  .hm-card.is-done img { filter: saturate(.55) brightness(.78); }

  /* ---------- FILTER TAG ---------- */
  #hmt-tf { position: fixed; top: 56px; right: 12px; bottom: 12px; width: min(340px, calc(100vw - 24px)); z-index: 99990; display: none; flex-direction: column; overflow: hidden;
    background: #1a1a24; color: #e6e6f0; border: 1px solid #33334a; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.6);
    font: 13px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif; text-align: left; }
  #hmt-tf.open { display: flex; }
  #hmt-tf *, #hmt-tf *::before, #hmt-tf *::after { box-sizing: border-box; }
  #hmt-tf button { all: unset; box-sizing: border-box; cursor: pointer; }
  #hmt-tf .tf-head { flex: none; display: flex; align-items: center; gap: 10px; padding: 12px 14px 12px 16px; }
  #hmt-tf .tf-title { flex: 1; font-size: 15px; font-weight: 700; color: #fff; }
  #hmt-tf .tf-close { width: 28px; height: 28px; border-radius: 8px; text-align: center; line-height: 28px; font-size: 16px; color: #9a9ab5; }
  #hmt-tf .tf-close:hover { background: #2a2a3b; color: #fff; }
  #hmt-tf .tf-top { flex: none; display: flex; flex-direction: column; gap: 8px; padding: 0 14px 12px; border-bottom: 1px solid #2b2b3b; }
  #hmt-tf .tf-seg { display: flex; gap: 4px; padding: 3px; border-radius: 11px; background: #12121a; }
  #hmt-tf .tf-seg button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 7px 0; border-radius: 8px; color: #8e8ea8; font-weight: 600; font-size: 12.5px; }
  #hmt-tf .tf-seg button:hover { color: #fff; }
  #hmt-tf .tf-seg button i { width: 8px; height: 8px; border-radius: 50%; background: currentColor; opacity: .85; }
  #hmt-tf .tf-seg button[data-v="inc"].on { background: #1f4033; color: #a8f0cc; }
  #hmt-tf .tf-seg button[data-v="exc"].on { background: #4a2530; color: #ffb3c0; }
  #hmt-tf .tf-search { position: relative; }
  #hmt-tf input.tf-in { width: 100%; height: 34px; padding: 0 30px 0 12px; border-radius: 10px; background: #12121a !important; color: #eee !important; border: 1px solid #2f2f45 !important; outline: none; font: 13px system-ui, sans-serif; }
  #hmt-tf input.tf-in:focus { border-color: #5b5f8a !important; }
  #hmt-tf .tf-x { display: none; position: absolute; right: 4px; top: 5px; width: 24px; height: 24px; border-radius: 6px; text-align: center; line-height: 24px; color: #8e8ea8; font-size: 13px; }
  #hmt-tf .tf-x.on { display: block; }
  #hmt-tf .tf-x:hover { background: #2a2a3b; color: #fff; }
  #hmt-tf .tf-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px 14px; scrollbar-width: thin; scrollbar-color: #3a3a50 transparent; }
  #hmt-tf .tf-hint { padding: 10px 12px; border-radius: 10px; background: #12121a; color: #8e8ea8; font-size: 12px; margin-bottom: 14px; }
  #hmt-tf .tf-active { display: flex; flex-direction: column; gap: 10px; padding: 12px; margin-bottom: 14px; border-radius: 12px; background: #12121a; }
  #hmt-tf .tf-code { padding: 7px 9px; border-radius: 8px; background: #1a1a24; color: #b9c4ff; font: 12px/1.4 ui-monospace, Consolas, monospace; word-break: break-all; user-select: all; }
  #hmt-tf .tf-lab { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 7px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #7f86b8; }
  #hmt-tf .tf-lab em { font-style: normal; font-weight: 500; letter-spacing: 0; text-transform: none; color: #6c6c88; }
  #hmt-tf .tf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  #hmt-tf .tf-empty { color: #6c6c88; font-size: 12px; padding: 4px 0; }
  #hmt-tf .tf-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 8px; background: #262636; color: #d3d5ee; font-size: 12px; font-weight: 600; border: 1px solid transparent; transition: background .12s; }
  #hmt-tf .tf-chip:hover { background: #313147; }
  #hmt-tf .tf-chip small { color: #7d7d99; font-weight: 500; font-size: 11px; }
  #hmt-tf .tf-chip.hide { background: #4a2530; color: #ffb3c0; border-color: #6e3040; }
  #hmt-tf .tf-chip.hide:hover { background: #5a2d3a; }
  #hmt-tf .tf-chip.req { background: #1f4033; color: #a8f0cc; border-color: #2b5f49; }
  #hmt-tf .tf-chip.req:hover { background: #274d3e; }
  #hmt-tf .tf-chip.hide small, #hmt-tf .tf-chip.req small { color: inherit; opacity: .7; }
  #hmt-tf .tf-ns { font-size: 11px; font-weight: 700; opacity: .9; }
  #hmt-tf .tf-ns.f { color: #ff9ec4; }
  #hmt-tf .tf-ns.m { color: #8fc2ff; }
  #hmt-tf .tf-ns.o { color: #c9b27a; font-weight: 600; }
  #hmt-tf .tf-chip.hide .tf-ns, #hmt-tf .tf-chip.req .tf-ns { color: inherit; }
  #hmt-tf .tf-foot { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-top: 1px solid #2b2b3b; }
  #hmt-tf .tf-clear { padding: 8px 12px; border-radius: 9px; background: #262636; color: #d3d5ee; font-weight: 600; font-size: 12.5px; white-space: nowrap; }
  #hmt-tf .tf-clear:hover { background: #34344c; color: #fff; }
  #hmt-tf .tf-go { flex: 1; display: block; text-align: center; padding: 9px 12px; border-radius: 9px; background: #3fa77a; color: #fff; font-weight: 700; font-size: 13.5px; }
  #hmt-tf .tf-go:hover { background: #48b988; }
  #hmt-tf .tf-go.dis { background: #2a2a3b; color: #6c6c88; cursor: default; }
  `;
  const style = document.createElement('style');
  style.id = 'hmt-style';
  style.textContent = css;

  // Style dipasang sedini mungkin (document-start) dan dipasang ulang kalau situs membuangnya.
  function ensureStyle() {
    if (!style.isConnected) (document.head || root).appendChild(style);
  }

  /* ====================================================================
   * Apply state (idempoten: tidak mengubah DOM kalau sudah sesuai)
   * ==================================================================== */
  function mixHex(a, b, t) { // campur warna a dengan b sebesar t (0..1)
    const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = n(a), B = n(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function setVar(name, val) {
    if (root.style.getPropertyValue(name) !== val) root.style.setProperty(name, val);
  }
  function apply() {
    ensureStyle();
    root.classList.toggle('hm-dark', !!state.dark);
    root.setAttribute('data-hmt-tp', state.toastPos || 'br');
    root.classList.toggle('hm-grid', !!(state.grid && !isReader));
    root.classList.toggle('hm-dt', state.cardStyle === 'detail');
    root.classList.toggle('hm-trim', !isReader && !trimmed);
    const tOn = !!(state.thumbs && isGallery && thumbHost && thumbHost.isConnected && thumbOrig && thumbOrig.isConnected);
    root.classList.toggle('hm-thumbs-on', tOn);
    if (thumbOrig) thumbOrig.classList.toggle('hmt-hide', tOn);
    setVar('--hm-tw', state.thumbW + 'px');
    root.classList.toggle('hm-webtoon', !!(state.webtoon && isReader && !wtFailed));
    root.classList.toggle('hm-search', !!state.searchOn);
    root.classList.toggle('hm-sticky', !!state.stickyNav);
    root.classList.toggle('hmt-ready', stkReady || !state.stickyNav || isReader);
    stickyNavSync();
    setVar('--hm-sw', state.searchW + 'px');
    setVar('--hm-card', state.cardW + 'px');
    const ac = /^#[0-9a-f]{6}$/i.test(state.accent) ? state.accent : '#5b7cff';
    setVar('--hm-ac', ac); setVar('--hm-ac2', mixHex(ac, '#ffffff', 0.18));
    setVar('--hm-act', mixHex(ac, '#ffffff', 0.6)); setVar('--hm-acbg', mixHex(ac, '#1b1b25', 0.72));
    setVar('--hm-rw', state.readerW ? state.readerW + 'px' : '100%');
  }
  // Banner judul: selector-nya diingat dari kunjungan sebelumnya, supaya sudah polos/gelap sejak awal (tanpa kedip)
  (function injectBannerPre() {
    if (isReader) return;
    const sel = get('bannerSel', '');
    if (!sel || !/^[#.\w\-\\:\s>]+$/.test(sel)) return;
    const st = document.createElement('style');
    st.id = 'hmt-style-pre';
    st.textContent = 'html.hm-dark ' + sel + ' { background-color: #14141a !important; background-image: none !important; }\n' +
      'html.hm-sticky:not(.hmt-ready) ' + sel + ' { visibility: hidden !important; }';
    root.appendChild(st);
  })();
  setTimeout(() => { stkReady = true; root.classList.add('hmt-ready'); }, 1500); // jaga-jaga: jangan sampai tersembunyi terus
  apply(); // langsung, sebelum halaman sempat tergambar -> tidak ada "kedip" tampilan asli

  // Self-heal: kalau situs menimpa class/style di <html>, pulihkan segera.
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['class', 'style'] });


  /* ====================================================================
   * Header tetap di atas (fixed + spacer; tidak bergantung struktur induk)
   * ==================================================================== */
  // Navbar + banner judul ("Recently Added") ditumpuk tetap di atas. Tidak ada toggle class saat layout -> tidak kedip.
  function stickyNavOff() {
    if (navRO) { navRO.disconnect(); navRO = null; }
    if (navAttrMO) { navAttrMO.disconnect(); navAttrMO = null; }
    stk.forEach((it) => {
      it.el.classList.remove('hmt-nav-fixed');
      it.el.style.left = it.el.style.width = it.el.style.top = '';
      it.sp.remove();
    });
    stk = [];
  }
  function stickyNavLayout() {
    if (stkRaf) return;
    stkRaf = requestAnimationFrame(() => { stkRaf = 0; stickyNavLayoutNow(); });
  }
  function stickyNavLayoutNow() {
    {
      let top = stk.length ? stk[0].mt : 0;
      for (const it of stk) {
        if (!it.el.isConnected || !it.sp.isConnected) continue;
        const h = it.el.offsetHeight;
        const r = it.sp.getBoundingClientRect();
        const sh = (h + it.mt + it.mb) + 'px';
        if (it.sp.style.height !== sh) it.sp.style.height = sh;
        const L = r.left + 'px', W = r.width + 'px', T = top + 'px';
        if (it.el.style.left !== L) it.el.style.left = L;
        if (it.el.style.width !== W) it.el.style.width = W;
        if (it.el.style.top !== T) it.el.style.top = T;
        top += h;
      }
    }
  }
  function findBanner() {
    const sels = [...document.querySelectorAll('select')].filter((x) => !x.closest('.navbar, #hmt-overlay, #hmt-dl, #hmt-tf, #hmt-panel, .hm-grid-wrap, .gallery-content'));
    for (const sel of sels) {
      for (let e = sel.parentElement; e && e !== document.body && !e.classList.contains('container'); e = e.parentElement) {
        if (e.querySelector('.hm-grid-wrap, .gallery-content, .navbar')) break;
        if (e.querySelector('h1, h2, h3') && e.offsetHeight < 160) return e;
      }
    }
    return null;
  }
  function stickyNavSync() {
    try { stickyNavSyncImpl(); } catch (e) { console.warn('[HMT] sticky header gagal', e); }
  }
  function stickyNavSyncImpl() {
    if (isReader || !document.body) return;
    if (!state.stickyNav) { stickyNavOff(); return; }
    if (stk.length && stk.every((it) => it.el.isConnected && it.sp.isConnected)) {
      if (stk.length > 1) return; // navbar + banner sudah terkunci
      const now = Date.now();
      if (now - stkBanTry < 400) return; // banner belum ada: cek paling sering tiap 0,4 dtk
      stkBanTry = now;
      if (!findBanner()) return;
    }
    stickyNavOff();
    const bannerEl = findBanner();
    if (bannerEl) {
      let sel = '';
      if (bannerEl.id) sel = '#' + bannerEl.id.replace(/[^\w-]/g, '');
      else {
        const cl = [...bannerEl.classList].filter((c) => !/^(hmt-|hm-)/.test(c) && /^[\w-]+$/.test(c)).slice(0, 3);
        if (cl.length) sel = bannerEl.tagName.toLowerCase() + '.' + cl.join('.');
      }
      if (sel && get('bannerSel', '') !== sel) set('bannerSel', sel);
    }
    const els = [document.querySelector('.navbar-static-top, .navbar'), bannerEl].filter(Boolean);
    if (!els.length) return;
    els.forEach((el) => {
      const cs = getComputedStyle(el);
      const sp = document.createElement('div');
      sp.className = 'hmt-nav-spacer';
      if (el !== els[0]) {
        el.classList.add('hmt-banner');
        // tandai elemen yang memuat tulisan judul (apa pun tag-nya), supaya tidak terpotong
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = tw.nextNode())) {
          if (!n.nodeValue.trim() || n.parentElement.closest('select, option, script, style')) continue;
          n.parentElement.classList.add('hmt-bt');
          break;
        }
      }
      sp.style.cssText = 'width:100%;pointer-events:none;';
      sp.style.height = el.offsetHeight + 'px';
      el.before(sp);
      stk.push({ el, sp, mt: parseFloat(cs.marginTop) || 0, mb: parseFloat(cs.marginBottom) || 0 });
    });
    stickyNavLayoutNow(); // posisi/ukuran dihitung dulu (sinkron), baru di-fixed -> tidak ada frame "loncat"
    stk.forEach((it) => it.el.classList.add('hmt-nav-fixed'));
    stickyNavLayoutNow();
    stkReady = true; root.classList.add('hmt-ready');
    // kalau skrip situs menimpa class/style elemen ini, pulihkan seketika (sebelum paint) -> tidak kedip
    navAttrMO = new MutationObserver(() => {
      let fix = false;
      stk.forEach((it, i) => {
        if (!it.el.classList.contains('hmt-nav-fixed')) { it.el.classList.add('hmt-nav-fixed'); fix = true; }
        if (i > 0 && !it.el.classList.contains('hmt-banner')) it.el.classList.add('hmt-banner');
      });
      if (fix) stickyNavLayoutNow();
    });
    stk.forEach((it) => navAttrMO.observe(it.el, { attributes: true, attributeFilter: ['class', 'style'] }));
    if (window.ResizeObserver) { navRO = new ResizeObserver(stickyNavLayout); stk.forEach((it) => { navRO.observe(it.sp); navRO.observe(it.el); }); }
  }
  window.addEventListener('resize', stickyNavLayout);
  onReady(() => { stickyNavSync(); setTimeout(stickyNavSync, 600); setInterval(stickyNavSync, 2000); });

  // gaya animasi: kf = keyframe, ease = easing, d = pengali durasi
  const INTRO_FX = {
    rise:  { label: 'Naik',            ease: 'cubic-bezier(.22, 1, .36, 1)', kf: [{ opacity: 0, transform: 'translateY(28px) scale(.95)' }, { opacity: 1, transform: 'none' }] },
    drop:  { label: 'Turun',           ease: 'cubic-bezier(.22, 1, .36, 1)', kf: [{ opacity: 0, transform: 'translateY(-28px) scale(.95)' }, { opacity: 1, transform: 'none' }] },
    slide: { label: 'Geser dari kiri', ease: 'cubic-bezier(.22, 1, .36, 1)', kf: [{ opacity: 0, transform: 'translateX(-56px)' }, { opacity: 1, transform: 'none' }] },
    pop:   { label: 'Pop (membal)',    ease: 'ease-out', d: 1.1, kf: [{ opacity: 0, transform: 'scale(.55)' }, { opacity: 1, transform: 'scale(1.06)', offset: .6 }, { opacity: 1, transform: 'none' }] },
    flip:  { label: 'Balik 3D',        ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.15,
             kf: [{ opacity: 0, transform: 'perspective(700px) rotateX(-75deg) translateY(24px)', transformOrigin: '50% 0%' }, { opacity: 1, transform: 'perspective(700px) rotateX(0deg) translateY(0)', transformOrigin: '50% 0%' }] },
    blur:  { label: 'Kabur ke jelas',  ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.1, kf: [{ opacity: 0, filter: 'blur(14px)', transform: 'scale(1.08)' }, { opacity: 1, filter: 'blur(0px)', transform: 'none' }] },
    wipe:  { label: 'Tirai (kiri ke kanan)', ease: 'cubic-bezier(.65, 0, .35, 1)', kf: [{ clipPath: 'inset(0 100% 0 0 round 8px)' }, { clipPath: 'inset(0 0 0 0 round 8px)' }] },
    fade:  { label: 'Fade polos',      ease: 'ease-out', kf: [{ opacity: 0 }, { opacity: 1 }] },
    right: { label: 'Geser dari kanan', ease: 'cubic-bezier(.22, 1, .36, 1)', kf: [{ opacity: 0, transform: 'translateX(56px)' }, { opacity: 1, transform: 'none' }] },
    diag:  { label: 'Geser diagonal',  ease: 'cubic-bezier(.22, 1, .36, 1)', kf: [{ opacity: 0, transform: 'translate(-34px, 34px)' }, { opacity: 1, transform: 'none' }] },
    zoomin: { label: 'Zoom mendekat',  ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.15, kf: [{ opacity: 0, transform: 'scale(1.3)' }, { opacity: 1, transform: 'none' }] },
    bounce: { label: 'Memantul dari bawah', ease: 'linear', d: 1.35,
              kf: [{ opacity: 0, transform: 'translateY(64px)', easing: 'cubic-bezier(.3, .9, .4, 1)' },
                   { opacity: 1, transform: 'translateY(-14px)', offset: .55, easing: 'ease-in-out' },
                   { opacity: 1, transform: 'translateY(5px)', offset: .78, easing: 'ease-in-out' },
                   { opacity: 1, transform: 'none' }] },
    swing: { label: 'Miring masuk',    ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.1, kf: [{ opacity: 0, transform: 'rotate(-9deg) translateY(30px)', transformOrigin: '0% 100%' }, { opacity: 1, transform: 'none', transformOrigin: '0% 100%' }] },
    skew:  { label: 'Geser miring',    ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.05, kf: [{ opacity: 0, transform: 'translateX(-46px) skewX(-14deg)' }, { opacity: 1, transform: 'none' }] },
    spin:  { label: 'Putar masuk',     ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.2, kf: [{ opacity: 0, transform: 'rotate(-120deg) scale(.4)' }, { opacity: 1, transform: 'none' }] },
    flipy: { label: 'Balik horizontal', ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.2, kf: [{ opacity: 0, transform: 'perspective(700px) rotateY(-80deg)', transformOrigin: '0% 50%' }, { opacity: 1, transform: 'perspective(700px) rotateY(0deg)', transformOrigin: '0% 50%' }] },
    tilt:  { label: 'Rebah 3D',        ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.15, kf: [{ opacity: 0, transform: 'perspective(700px) rotateX(70deg) translateY(30px)', transformOrigin: '50% 100%' }, { opacity: 1, transform: 'perspective(700px) rotateX(0deg) translateY(0)', transformOrigin: '50% 100%' }] },
    iris:  { label: 'Iris (lingkaran membuka)', ease: 'cubic-bezier(.65, 0, .35, 1)', d: 1.2, kf: [{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }] },
    wipeup: { label: 'Tirai (bawah ke atas)', ease: 'cubic-bezier(.65, 0, .35, 1)', kf: [{ clipPath: 'inset(100% 0 0 0 round 8px)' }, { clipPath: 'inset(0 0 0 0 round 8px)' }] },
  };
  const INTRO_STYLE_OPTS = Object.keys(INTRO_FX).map((k) => [k, INTRO_FX[k].label]).concat([['mix', 'Campur (acak tiap kartu)']]);
  const INTRO = { dur: 750, maxStagger: 1800, settle: 250, maxWait: 3500 };
  // gaya animasi header (navbar / banner judul). 'items' = tiap bagian (logo, menu, search) muncul satu per satu
  const HEAD_FX = {
    none:   { label: 'Tanpa animasi' },
    slide:  { label: 'Geser dari atas',  ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.1, kf: [{ opacity: 0, transform: 'translateY(-100%)' }, { opacity: 1, transform: 'none' }] },
    fade:   { label: 'Fade polos',       ease: 'ease-out', d: 1.2, kf: [{ opacity: 0 }, { opacity: 1 }] },
    wipe:   { label: 'Tirai (kiri ke kanan)', ease: 'cubic-bezier(.65, 0, .35, 1)', d: 1.3, kf: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }] },
    unfold: { label: 'Buka dari atas',   ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.1, kf: [{ opacity: 0, transform: 'scaleY(0)', transformOrigin: '50% 0%' }, { opacity: 1, transform: 'scaleY(1)', transformOrigin: '50% 0%' }] },
    blur:   { label: 'Kabur ke jelas',   ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.2, kf: [{ opacity: 0, filter: 'blur(12px)' }, { opacity: 1, filter: 'blur(0px)' }] },
    zoom:   { label: 'Zoom masuk',       ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.1, kf: [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }] },
    left:   { label: 'Geser dari kiri',  ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.1, kf: [{ opacity: 0, transform: 'translateX(-60px)' }, { opacity: 1, transform: 'none' }] },
    right:  { label: 'Geser dari kanan', ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.1, kf: [{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'none' }] },
    bounce: { label: 'Turun memantul',   ease: 'linear', d: 1.5,
              kf: [{ opacity: 0, transform: 'translateY(-100%)', easing: 'cubic-bezier(.3, .9, .4, 1)' },
                   { opacity: 1, transform: 'translateY(8px)', offset: .6, easing: 'ease-in-out' },
                   { opacity: 1, transform: 'translateY(-3px)', offset: .82, easing: 'ease-in-out' },
                   { opacity: 1, transform: 'none' }] },
    flipx:  { label: 'Balik 3D (dari atas)', ease: 'cubic-bezier(.22, 1, .36, 1)', d: 1.2, kf: [{ opacity: 0, transform: 'perspective(900px) rotateX(-90deg)', transformOrigin: '50% 0%' }, { opacity: 1, transform: 'perspective(900px) rotateX(0deg)', transformOrigin: '50% 0%' }] },
    iris:   { label: 'Iris (melebar dari tengah)', ease: 'cubic-bezier(.65, 0, .35, 1)', d: 1.3, kf: [{ clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0 0 0)' }] },
    items:  { label: 'Bagian satu per satu' },
  };
  const BLOCK_STYLE_OPTS = [['none', 'Tanpa animasi']].concat(Object.keys(INTRO_FX).map((k) => [k, INTRO_FX[k].label]));
  const HEAD_STYLE_OPTS = Object.keys(HEAD_FX).map((k) => [k, HEAD_FX[k].label]);


  /* ====================================================================
   * Panel Pengaturan (menu "Pengaturan" di navbar atau Alt+S)
   * ==================================================================== */
  const DEFAULTS = { dark: true, grid: true, webtoon: true, cardW: 190, cardStyle: 'detail', readerW: 800,
    thumbs: true, thumbReader: false, thumbW: 160, pvOn: true, pvSize: 80, pvDelay: 150, pvMode: 'side', dlPanel: true, dlFmt: 'orig', dlQ: 90, dlOut: 'zip', dlDest: 'dl', dlThumb: 150, accent: '#5b7cff', dlMark: true, searchOn: true, stickyNav: true, introOn: true, toastPos: 'br', introScroll: true, introScrollStyle: 'same', introBlock: 'rise', introNav: 'slide', introBanner: 'wipe', introStyle: 'rise', introOrder: 'seq', introSpeed: 1, introStep: 80, searchW: 520, romaji: true, romajiKanji: true, romajiLong: 'simple', tfInc: [], tfExc: [] };
  let buildWebtoonFn = null; // diisi di bagian reader
  const refreshers = [];
  let overlay = null;
  let panelReady = false;

  function afterChange(key) {
    if (key === 'webtoon' && state.webtoon && isReader && !window.__wtReady && buildWebtoonFn) {
      wtFailed = false; apply(); buildWebtoonFn();
    } else apply();
    if (key === 'dark' && state.dark && !isReader) rescanDark();
    if (key === 'thumbs' || key === 'thumbReader') rebuildThumbs();
    if (key === 'pvOn') hidePreview();
    if (key === 'dlMark') markCards();
    if (key === 'romaji' || key === 'romajiKanji' || key === 'romajiLong') {
      rmCache.clear();
      if (kmState === 'error') kmState = 'idle';
      if (state.romaji && state.romajiKanji) kmLoad();
      romajiApply();
    }
    if (key === 'toastPos') toast('Notifikasi akan muncul di sini', { type: 'info', ms: 2500 });
    if (key === 'introScroll') srRefresh();
    else if (key !== 'introScrollStyle' && key.indexOf('intro') === 0) introPreview();
    applyTagFilter();
    if (tfUi && tfEl && tfEl.classList.contains('open')) renderTf();
  }

  function section(panel, title) {
    panel.appendChild(mk('div', 'hmt-sec', T(title)));
    panel._g = null; // baris berikutnya masuk ke kartu baru
  }

  function grpOf(panel) {
    if (!panel._g) { panel._g = mk('div', 'hmt-grp'); panel.appendChild(panel._g); }
    return panel._g;
  }

  function row(panel, label, desc, ctrl, col) {
    const r = mk('div', 'hmt-row' + (col ? ' col' : ''));
    const left = mk('div', 'hmt-txt');
    left.appendChild(mk('div', 'hmt-lbl', T(label)));
    if (desc) left.appendChild(mk('div', 'hmt-desc', T(desc)));
    r.appendChild(left);
    if (ctrl) r.appendChild(ctrl);
    grpOf(panel).appendChild(r);
    return r;
  }

  const refreshAll = () => refreshers.forEach((f) => f());
  // baris diredupkan & dikunci selama saklar induknya mati
  function dep(r, key) {
    const f = () => r.classList.toggle('hmt-dis', !state[key]);
    refreshers.push(f); f();
    return r;
  }

  function addSwitch(panel, label, desc, key) {
    const sw = mk('button', 'hmt-sw');
    sw.type = 'button';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-label', T(label));
    const refresh = () => sw.setAttribute('aria-checked', String(!!state[key]));
    sw.addEventListener('click', () => { state[key] = !state[key]; set(key, state[key]); refreshAll(); afterChange(key); });
    refreshers.push(refresh); refresh();
    const r = row(panel, label, desc, sw);
    r.classList.add('hmt-clk'); // klik di mana saja pada baris = ubah saklar
    r.addEventListener('click', (e) => { if (!e.target.closest('button')) sw.click(); });
    return r;
  }

  function addRange(panel, label, desc, key, min, max, step, unit) {
    const box = mk('div', 'hmt-rangebox');
    const input = document.createElement('input');
    input.type = 'range'; input.className = 'hmt-range';
    input.min = min; input.max = max; input.step = step;
    const val = mk('span', 'hmt-val');
    const refresh = () => { input.value = state[key]; val.textContent = state[key] + unit; };
    input.addEventListener('input', () => { state[key] = +input.value; val.textContent = state[key] + unit; set(key, state[key]); apply(); if (key.indexOf('intro') === 0) introPreview(); });
    refreshers.push(refresh); refresh();
    box.append(input, val);
    return row(panel, label, desc, box);
  }

  function addSeg(panel, label, desc, key, opts) {
    const seg = mk('div', 'hmt-seg');
    const btns = opts.map(([v, t]) => {
      const b = mk('button', '', T(t)); b.type = 'button';
      b.addEventListener('click', () => {
        state[key] = v; set(key, v);
        if (key === 'lang') { langChanged(); return; }
        refresh(); apply(); if (key.indexOf('intro') === 0) introPreview();
      });
      seg.appendChild(b); return [v, b];
    });
    const refresh = () => btns.forEach(([v, b]) => b.classList.toggle('on', state[key] === v));
    refreshers.push(refresh); refresh();
    return row(panel, label, desc, seg);
  }

  function addSelect(panel, label, desc, key, opts) {
    const sel = mk('select', 'hmt-sel');
    opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = String(v); o.textContent = T(t); sel.appendChild(o); });
    const refresh = () => { sel.value = String(state[key]); };
    sel.addEventListener('change', () => { const o = opts.find(([v]) => String(v) === sel.value); state[key] = o ? o[0] : sel.value; set(key, state[key]); afterChange(key); });
    refreshers.push(refresh); refresh();
    return row(panel, label, desc, sel);
  }

  let curTab = 'tampilan';
  function addAccent(panel) {
    const box = mk('div', 'hmt-acc');
    const presets = ['#5b7cff', '#a259ff', '#ff5d8f', '#ff8a3d', '#2ec4b6', '#3ecf8e'];
    const setAc = (c) => { state.accent = c; set('accent', c); refresh(); apply(); };
    const btns = presets.map((c) => {
      const b = mk('button', 'hmt-dot'); b.type = 'button'; b.title = c; b.style.background = c;
      b.addEventListener('click', () => setAc(c)); box.appendChild(b); return [c, b];
    });
    const inp = document.createElement('input'); inp.type = 'color'; inp.className = 'hmt-color'; inp.title = T('Warna kustom');
    inp.addEventListener('input', () => setAc(inp.value));
    box.appendChild(inp);
    const refresh = () => {
      btns.forEach(([c, b]) => b.classList.toggle('on', c === String(state.accent).toLowerCase()));
      inp.value = /^#[0-9a-f]{6}$/i.test(state.accent) ? state.accent : '#5b7cff';
    };
    refreshers.push(refresh); refresh();
    return row(panel, 'Warna aksen', 'Warna tombol, slider, dan penanda', box);
  }

  // Ganti bahasa: bangun ulang semua UI yang sudah terlanjur dibuat supaya teksnya ikut berganti.
  function langChanged() {
    if (overlay) { overlay.remove(); overlay = null; }
    buildPanel();
    overlay.classList.add('hmt-still', 'open'); // tanpa animasi buka, supaya tidak berkedip
    refreshAll();
    const a = document.querySelector('#hmt-nav a'); if (a) a.textContent = T('⚙ Pengaturan');
    const a2 = document.querySelector('#hmt-tf-nav a'); if (a2) a2.title = T('Filter Tag (Alt+T)');
    const fab = document.getElementById('hmt-fab'); if (fab) fab.title = T('Pengaturan (Alt+S)');
    if (tfEl) { const was = tfEl.classList.contains('open'); tfEl.remove(); tfEl = null; tfUi = null; if (was) openTf(); }
    if (dlEl) closeDl();
    if (dmEl) { dmEl.remove(); dmEl = null; dmBody = null; dmTitle = null; dmPlaced = false; dmRows.clear(); dmTick(); }
    document.querySelectorAll('.hm-done').forEach((b) => b.remove());
    markCards();
  }

  function buildPanel() {
    refreshers.length = 0;
    overlay = mk('div'); overlay.id = 'hmt-overlay';
    const panel = mk('div'); panel.id = 'hmt-panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', T('Pengaturan'));
    overlay.appendChild(panel);

    const head = mk('div', 'hmt-head');
    const ttl = mk('div', 'hmt-ttl');
    ttl.appendChild(mk('div', 'hmt-title', T('Pengaturan')));
    const sub = mk('div', 'hmt-sub');
    sub.append(mk('b', '', AUTHOR), document.createTextNode(' · v' + VERSION));
    ttl.appendChild(sub);
    const close = mk('button', 'hmt-close', '✕'); close.type = 'button'; close.title = T('Tutup (Esc)');
    close.addEventListener('click', closePanel);
    head.append(mk('div', 'hmt-logo', '⚙'), ttl, close);

    const body = mk('div', 'hmt-body');
    const nav = mk('div', 'hmt-nav');
    const tabs = [];
    const addTab = (id, icon, label) => {
      const btn = mk('button', 'hmt-tab'); btn.type = 'button';
      btn.append(mk('span', 'hmt-ic', icon), mk('span', 'hmt-tl', T(label)));
      const pane = mk('div', 'hmt-pane');
      btn.addEventListener('click', () => { curTab = id; tabs.forEach((t) => { t.btn.classList.toggle('on', t.id === id); t.pane.classList.toggle('on', t.id === id); t.pane.scrollTop = 0; }); });
      tabs.push({ id, btn, pane });
      nav.appendChild(btn);
      return pane;
    };

    /* ---- Tampilan ---- */
    const pView = addTab('tampilan', '🎨', 'Tampilan');
    section(pView, 'Umum');
    addSeg(pView, 'Bahasa / Language', 'Bahasa antarmuka panel dan notifikasi', 'lang', [['id', 'Indonesia'], ['en', 'English']]);
    addSwitch(pView, 'Mode gelap', 'Tema gelap untuk seluruh situs', 'dark');
    addAccent(pView);
    addSelect(pView, 'Posisi notifikasi', 'Tempat muncul pesan seperti "Kamus kanji siap"', 'toastPos',
      [['br', 'Kanan bawah'], ['bl', 'Kiri bawah'], ['bc', 'Tengah bawah'], ['tr', 'Kanan atas'], ['tl', 'Kiri atas'], ['tc', 'Tengah atas']]);
    section(pView, 'Header');
    addSwitch(pView, 'Header tetap di atas', 'Navbar (menu & pencarian) tidak hilang saat halaman di-scroll', 'stickyNav');
    addSwitch(pView, 'Perpanjang kolom search', 'Kolom pencarian di header dibuat lebih panjang', 'searchOn');
    dep(addRange(pView, 'Lebar kolom search', 'Lebar kolom pencarian (px)', 'searchW', 240, 900, 20, 'px'), 'searchOn');
    if (!isReader) {
      section(pView, 'Daftar galeri');
      addSwitch(pView, 'Poster grid', 'Tampilkan galeri sebagai kartu poster', 'grid');
      dep(addSeg(pView, 'Gaya kartu', 'Detail: cover + tabel info seperti halaman galeri. Poster: cover penuh', 'cardStyle', [['detail', 'Detail'], ['poster', 'Poster']]), 'grid');
      dep(addRange(pView, 'Ukuran kartu', 'Lebar minimum tiap kartu poster', 'cardW', 110, 400, 10, 'px'), 'grid');
    } else {
      section(pView, 'Reader');
      addSwitch(pView, 'Mode webtoon', 'Scroll vertikal, semua halaman berurutan', 'webtoon');
      dep(addSeg(pView, 'Lebar gambar', 'Lebar halaman pada mode webtoon (px)', 'readerW',
        [[600, '600'], [800, '800'], [1000, '1000'], [0, 'Penuh']]), 'webtoon');
    }

    /* ---- Animasi ---- */
    if (!isReader) {
      const pAnim = addTab('animasi', '🎬', 'Animasi');
      section(pAnim, 'Saat halaman dimuat');
      addSwitch(pAnim, 'Animasi saat memuat', 'Header dan kartu muncul dengan animasi saat halaman dimuat', 'introOn');
      section(pAnim, 'Header');
      dep(addSelect(pAnim, 'Navbar (menu atas)', 'Efek masuk untuk logo, menu, dan kolom search', 'introNav', HEAD_STYLE_OPTS), 'introOn');
      dep(addSelect(pAnim, 'Banner judul', 'Efek masuk untuk bar \"Recently Added\" (halaman daftar)', 'introBanner', HEAD_STYLE_OPTS), 'introOn');
      section(pAnim, 'Halaman galeri');
      dep(addSelect(pAnim, 'Cover & info', 'Efek masuk untuk cover, judul, dan tabel info saat membuka sebuah galeri', 'introBlock', BLOCK_STYLE_OPTS), 'introOn');
      section(pAnim, 'Kartu & thumbnail');
      dep(addSelect(pAnim, 'Gaya animasi', 'Pilih efek masuk tiap kartu. Perubahan langsung dipratinjau di halaman', 'introStyle', INTRO_STYLE_OPTS), 'introOn');
      dep(addSelect(pAnim, 'Urutan muncul', 'Berurutan: kiri ke kanan lalu ke bawah. Diagonal: menyapu dari pojok kiri-atas. Acak: urutan dikocok', 'introOrder',
        [['seq', 'Berurutan (kiri-atas)'], ['diag', 'Diagonal'], ['rand', 'Acak']]), 'introOn');
      dep(addSeg(pAnim, 'Kecepatan', 'Durasi animasi tiap kartu', 'introSpeed', [[0.6, 'Cepat'], [1, 'Normal'], [1.7, 'Lambat']]), 'introOn');
      dep(addRange(pAnim, 'Jeda antar kartu', 'Selisih waktu muncul antar kartu (ms)', 'introStep', 0, 300, 10, 'ms'), 'introOn');
      const bPlay = mk('button', 'hmt-reset', T('Putar ulang')); bPlay.type = 'button';
      bPlay.addEventListener('click', () => introPreview());
      dep(row(pAnim, 'Pratinjau', 'Putar ulang animasi pada kartu yang sedang terlihat', bPlay), 'introOn');
      section(pAnim, 'Saat di-scroll');
      addSwitch(pAnim, 'Animasi saat di-scroll', 'Kartu dan thumbnail di bawah layar muncul dengan animasi ketika di-scroll sampai ke situ', 'introScroll');
      dep(addSelect(pAnim, 'Gaya saat di-scroll', 'Efek masuk untuk kartu yang baru terlihat. Coba scroll halaman untuk melihatnya', 'introScrollStyle', [['same', 'Sama dengan gaya kartu']].concat(INTRO_STYLE_OPTS)), 'introScroll');
    }

    if (!isReader) {
      /* ---- Thumbnail ---- */
      const pThumb = addTab('thumb', '🖼', 'Thumbnail');
      section(pThumb, 'Thumbnail galeri');
      addSwitch(pThumb, 'Thumbnail besar', 'Ganti strip thumbnail dengan grid besar', 'thumbs');
      dep(addSwitch(pThumb, 'Resolusi asli', 'Pakai gambar reader di thumbnail (berat). Mati = ringan', 'thumbReader'), 'thumbs');
      dep(addRange(pThumb, 'Ukuran thumbnail', 'Lebar minimum tiap thumbnail', 'thumbW', 120, 420, 10, 'px'), 'thumbs');

      /* ---- Romaji ---- */
      const pRm = addTab('romaji', '🔤', 'Romaji');
      section(pRm, 'Judul');
      addSwitch(pRm, 'Judul ke romaji', 'Ubah tulisan Jepang (hiragana, katakana, kanji) di judul jadi huruf latin. Arahkan kursor ke kartu untuk melihat judul asli', 'romaji');
      dep(addSwitch(pRm, 'Ubah kanji juga', 'Unduh kamus kanji sekali (±17 MB, lalu tersimpan di cache browser). Mati = hanya kana yang diubah', 'romajiKanji'), 'romaji');
      dep(addSeg(pRm, 'Vokal panjang', 'Cara menulis vokal panjang: toukyou atau tokyo', 'romajiLong',
        [['simple', 'Sederhana'], ['keep', 'Apa adanya']]), 'romaji');

      /* ---- Hover preview ---- */
      const pPrev = addTab('preview', '🔍', 'Hover preview');
      section(pPrev, 'Pratinjau saat hover');
      addSwitch(pPrev, 'Hover preview', 'Tampilkan halaman besar saat kursor di thumbnail', 'pvOn');
      dep(addRange(pPrev, 'Ukuran preview', 'Tinggi preview (% tinggi layar)', 'pvSize', 30, 98, 2, '%'), 'pvOn');
      dep(addRange(pPrev, 'Jeda muncul', 'Waktu tunggu sebelum preview muncul', 'pvDelay', 0, 800, 50, 'ms'), 'pvOn');
      dep(addSeg(pPrev, 'Posisi preview', 'Di samping thumbnail atau mengikuti kursor', 'pvMode',
        [['side', 'Samping'], ['cursor', 'Kursor']]), 'pvOn');

      /* ---- Unduhan ---- */
      const pDl = addTab('unduh', '⬇', 'Unduhan');
      section(pDl, 'Panel unduhan');
      addSwitch(pDl, 'Panel pilih unduhan', 'Klik Download → pilih gambar dulu; jalan di latar belakang antar halaman', 'dlPanel');
      dep(addSeg(pDl, 'Hasil default', 'Bentuk file yang dihasilkan', 'dlOut',
        [['zip', 'ZIP'], ['pdf', 'PDF']].concat(HAS_DIR ? [['img', 'Gambar']] : [])), 'dlPanel');
      dep(addRange(pDl, 'Kualitas JPG/PDF', 'Dipakai untuk PDF atau konversi JPG', 'dlQ', 50, 100, 5, '%'), 'dlPanel');
      dep(addRange(pDl, 'Ukuran thumbnail panel', 'Lebar thumbnail di panel pilih gambar', 'dlThumb', 90, 320, 10, 'px'), 'dlPanel');
      section(pDl, 'Riwayat');
      addSwitch(pDl, 'Tandai yang sudah diunduh', 'Badge "✓ Diunduh" dan kartu diredupkan di daftar galeri', 'dlMark');
      const bClear = mk('button', 'hmt-reset'); bClear.type = 'button';
      const cntRefresh = () => { bClear.textContent = T('Hapus daftar ({0})', Object.keys(doneMap()).length); };
      refreshers.push(cntRefresh); cntRefresh();
      bClear.addEventListener('click', async () => {
        const n = Object.keys(doneMap()).length;
        if (!n) { toast('Daftar sudah kosong'); return; }
        const ok = await askConfirm({ title: 'Hapus daftar sudah diunduh?', text: T('{0} galeri akan kehilangan penanda. File hasil unduhan tidak ikut terhapus.', n), ok: 'Hapus', cancel: 'Batal', danger: true });
        if (!ok) return;
        set('dlDone', {}); markCards(); cntRefresh(); toast('Daftar penanda dihapus', { type: 'ok' });
      });
      row(pDl, 'Daftar sudah diunduh', 'Reset semua penanda "diunduh"', bClear);
    }

    /* ---- Lainnya ---- */
    const pMisc = addTab('lainnya', '🛠', 'Lainnya');
    const keys = (t) => { const w = mk('div'); w.appendChild(mk('kbd', '', t)); return w; };
    section(pMisc, 'Pintasan');
    row(pMisc, 'Buka/tutup pengaturan', null, keys('Alt+S'));
    if (!isReader) row(pMisc, 'Buka/tutup Filter Tag', null, keys('Alt+T'));
    section(pMisc, 'Diagnostik');
    const dumpBtn = mk('button', 'hmt-reset', T('Salin dump')); dumpBtn.type = 'button';
    dumpBtn.addEventListener('click', () => copyDump(dumpBtn));
    row(pMisc, 'Dump latar terang', 'Salin daftar elemen berlatar putih (untuk dicek)', dumpBtn);
    section(pMisc, 'Tentang');
    const badge = mk('span', 'hmt-badge');
    badge.append(mk('b', '', AUTHOR), document.createTextNode(' · v' + VERSION));
    row(pMisc, 'Hitomi Tweak', 'Poster grid, mode gelap, reader webtoon, dan filter tag untuk hitomi.la', badge);

    tabs.forEach((t) => body.appendChild(t.pane));
    body.insertBefore(nav, body.firstChild);
    const first = tabs.find((t) => t.id === curTab) || tabs[0];
    curTab = first.id;
    first.btn.classList.add('on'); first.pane.classList.add('on');

    /* ---- kaki: pintasan + reset ---- */
    const foot = mk('div', 'hmt-foot');
    const hint = mk('span'); hint.append(T('Buka/tutup: '));
    hint.appendChild(mk('kbd', '', 'Alt+S'));
    const rst = mk('button', 'hmt-reset warn', T('Reset default')); rst.type = 'button';
    rst.addEventListener('click', async () => {
      const ok = await askConfirm({ title: 'Reset semua pengaturan?', text: 'Semua pengaturan dikembalikan ke nilai awal.', ok: 'Reset', cancel: 'Batal', danger: true });
      if (!ok) return;
      Object.keys(DEFAULTS).forEach((k) => { state[k] = DEFAULTS[k]; set(k, DEFAULTS[k]); }); // bahasa tidak ikut di-reset
      refreshAll();
      afterChange('webtoon');
      toast('Pengaturan dikembalikan ke default', { type: 'ok' });
    });
    foot.append(hint, rst);
    panel.append(head, body, foot);

    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closePanel(); });
    document.body.appendChild(overlay);
  }

  function openPanel() {
    if (!overlay) buildPanel();
    else if (!overlay.isConnected) document.body.appendChild(overlay); // situs sempat menghapus body
    refreshers.forEach((f) => f());
    overlay.classList.add('open');
  }
  function closePanel() { if (overlay) overlay.classList.remove('open'); }
  function togglePanel() { if (overlay && overlay.classList.contains('open')) closePanel(); else openPanel(); }

  function addNavEntry() {
    if (document.getElementById('hmt-nav')) return true;
    const ul = document.querySelector('.navbar-nav, .navbar .nav, .navbar ul');
    if (!ul) return false;
    const li = mk('li'); li.id = 'hmt-nav';
    const a = mk('a', '', T('⚙ Pengaturan')); a.href = '#';
    a.addEventListener('click', (e) => { e.preventDefault(); togglePanel(); });
    li.appendChild(a); ul.appendChild(li);
    if (!isReader && !document.getElementById('hmt-tf-nav')) {
      const li2 = mk('li'); li2.id = 'hmt-tf-nav';
      const a2 = mk('a', '', '🏷 Filter'); a2.href = '#'; a2.title = T('Filter Tag (Alt+T)');
      a2.addEventListener('click', (e) => { e.preventDefault(); toggleTf(); });
      li2.appendChild(a2); ul.appendChild(li2);
      updateTfBadge();
    }
    const fab = document.getElementById('hmt-fab');
    if (fab) fab.remove();
    return true;
  }

  // Dipanggil berkala oleh observer: pasang ulang menu kalau navbar dirender ulang situs.
  function ensureNav() {
    if (panelReady && (!document.getElementById('hmt-nav') || (!isReader && !document.getElementById('hmt-tf-nav')))) {
      const old = document.getElementById('hmt-nav'); if (old && !document.getElementById('hmt-tf-nav')) old.remove();
      addNavEntry();
    }
  }

  function initPanel() {
    panelReady = true;
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) { e.stopImmediatePropagation(); closePanel(); return; }
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyS') { e.preventDefault(); e.stopImmediatePropagation(); togglePanel(); }
    }, true);

    let tries = 0;
    (function tick() {
      if (addNavEntry()) return;
      if (++tries < 12) return setTimeout(tick, 400);
      // fallback kalau navbar tidak ketemu: satu tombol kecil
      if (document.getElementById('hmt-fab')) return;
      const fab = mk('button', '', '⚙'); fab.id = 'hmt-fab'; fab.title = T('Pengaturan (Alt+S)');
      fab.addEventListener('click', togglePanel);
      document.body.appendChild(fab);
    })();
  }

  /* ====================================================================
   * POSTER GRID (list + related galleries)
   * Kartu asli situs dibaca, lalu dibangun ulang jadi kartu poster bersih.
   * ==================================================================== */
  const LANG = {
    'english': 'EN', '日本語': 'JP', '中文': 'CN', 'bahasa indonesia': 'ID', '한국어': 'KR',
    'español': 'ES', 'français': 'FR', 'deutsch': 'DE', 'русский': 'RU', 'italiano': 'IT',
    'português': 'PT', 'tiếng việt': 'VI', 'ไทย': 'TH', 'polski': 'PL', 'türkçe': 'TR',
  };
  const TYPE = {
    'doujinshi': 'DJ', 'manga': 'MG', 'artist cg': 'ACG', 'game cg': 'GCG', 'imageset': 'IS', 'anime': 'AN',
  };

  function cardSrc(card) {
    const imgEl = card.querySelector('.dj-img1 img') || card.querySelector('img');
    let src = '';
    if (imgEl) src = imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '';
    if (!src) {
      const s = card.querySelector('.dj-img1 source[data-srcset], source[data-srcset]');
      if (s) src = (s.getAttribute('data-srcset') || '').trim().split(/\s+/)[0];
    }
    if (src.startsWith('//')) src = 'https:' + src;
    return src;
  }

  function parseCard(card) {
    const a = card.querySelector('a.lillie') || card.querySelector('a[href]');
    if (!a) return null;

    const rows = {};
    card.querySelectorAll('table.dj-desc tr').forEach((tr) => {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 2) rows[txt(tds[0]).toLowerCase()] = tds[1];
    });
    const list = (td) => (td ? [...td.querySelectorAll('a')].map(txt).filter((t) => t && t !== '...') : []);

    const dateM = card.textContent.match(/[A-Z][a-z]{2} \d{1,2}, \d{4}(?:, \d{1,2}:\d{2} [AP]M)?/);

    return {
      href: a.href,
      src: cardSrc(card),
      title: txt(card.querySelector('h1.lillie')) || txt(a),
      artists: [...card.querySelectorAll('.artist-list a')].map(txt),
      series: list(rows.series).join(', '),
      group: list(rows.group || rows.groups).join(', '),
      chars: list(rows.characters || rows.character).join(', '),
      type: txt(rows.type),
      lang: txt(rows.language),
      tags: list(rows.tags),
      tagKeys: rows.tags ? [...rows.tags.querySelectorAll('a')].map(tfKeyFromAnchor).filter(Boolean) : [],
      date: dateM ? dateM[0] : '',
    };
  }

  /* ---------- penanda "sudah diunduh" ---------- */
  const gidOfHref = (h) => { const m = String(h || '').match(/(\d+)\.html(?:[#?].*)?$/); return m ? m[1] : ''; };
  const doneMap = () => { const m = get('dlDone', {}); return m && typeof m === 'object' ? m : {}; };
  function decorateDone(a, m) {
    const id = a.dataset.gid || (a.dataset.gid = gidOfHref(a.getAttribute('href')));
    const on = !!(state.dlMark && id && m[id]);
    a.classList.toggle('is-done', on);
    const b = a.querySelector('.hm-done');
    if (on && !b) a.appendChild(mk('div', 'hm-done', T('✓ Diunduh')));
    else if (!on && b) b.remove();
  }
  function markCards() { const m = doneMap(); document.querySelectorAll('.hm-card').forEach((a) => decorateDone(a, m)); }
  function markDone(id) { if (!id) return; const m = doneMap(); m[id] = Date.now(); set('dlDone', m); markCards(); }
  function unmarkDone(id) { const m = doneMap(); delete m[id]; set('dlDone', m); markCards(); }

  function makeCard(d) {
    const a = mk('a', 'hm-card');
    a.href = d.href;
    a.title = [d.title, d.artists.join(', '), d.series, d.type, d.lang, d.date].filter(Boolean).join('\n');
    a.dataset.tfk = (d.tagKeys || []).join('|');
    if (d.type) a.dataset.type = d.type.toLowerCase().replace(/[^a-z]/g, ''); // 'Artist CG' -> 'artistcg'

    const cover = mk('div', 'hm-cover');
    const img = document.createElement('img');
    img.loading = 'lazy'; img.decoding = 'async'; img.alt = '';
    if (d.src) img.src = d.src;
    img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
    cover.appendChild(img);

    const tags = mk('div', 'hm-tags');
    d.tags.slice(0, 24).forEach((t) => tags.appendChild(mk('span', '', t)));
    cover.appendChild(tags);

    const badges = mk('div', 'hm-badges');
    const langCode = LANG[d.lang.toLowerCase()] || (d.lang && d.lang.toLowerCase() !== 'n/a' ? d.lang.slice(0, 2).toUpperCase() : '');
    badges.appendChild(mk('span', 'hm-badge', langCode));
    badges.appendChild(mk('span', 'hm-badge', TYPE[d.type.toLowerCase()] || d.type.slice(0, 3).toUpperCase()));
    if (!langCode) badges.firstChild.style.visibility = 'hidden';
    cover.appendChild(badges);

    const ov = mk('div', 'hm-ov');
    ov.appendChild(mk('div', 'hm-title', d.title));
    const sub = [d.artists.join(', '), d.series].filter(Boolean).join(' · ');
    if (sub) ov.appendChild(mk('div', 'hm-sub', sub));
    cover.appendChild(ov);
    a.appendChild(cover);

    // panel info (dipakai di gaya "detail")
    const info = mk('div', 'hm-info');
    info.appendChild(mk('div', 'hm-it', d.title));
    if (d.artists.length) info.appendChild(mk('div', 'hm-ia', d.artists.join(', ')));
    const rows = mk('div', 'hm-rows');
    const addRow = (k, v, cls) => { if (!v) return; rows.append(mk('div', 'hm-k', k), mk('div', 'hm-v' + (cls ? ' ' + cls : ''), v)); };
    addRow('Group', d.group);
    addRow('Type', d.type, 'hm-vtype');
    addRow('Language', d.lang);
    addRow('Series', d.series);
    addRow('Characters', d.chars);
    if (d.tags.length) {
      const chips = mk('div', 'hm-chips');
      d.tags.forEach((t) => chips.appendChild(mk('span', '', t)));
      rows.append(mk('div', 'hm-k', 'Tags'), chips);
    }
    info.appendChild(rows);
    a.appendChild(info);
    decorateDone(a, doneMap());

    return a;
  }

  // Kartu di-cache per URL: selama galeri masih ada di daftar, elemen kartunya dipakai ulang
  // (gambar tidak dimuat ulang), jadi tidak ada kedip saat situs merender ulang daftar.
  const cardCache = new Map(); // href -> { el, sig }
  const boxState = new WeakMap(); // .gallery-content -> { wrap, emptySince }
  const EMPTY_GRACE = 1500; // tahan grid lama sebentar saat situs mengosongkan daftar

  const hrefOf = (c) => {
    const a = c.querySelector('a.lillie') || c.querySelector('a[href]');
    return a ? a.href : '';
  };
  const cardSig = (d) => [d.title, d.artists.join(','), d.series, d.group, d.chars, d.type, d.lang, d.tags.join(','), d.date].join('\u0001');

  function stateOf(box) {
    let s = boxState.get(box);
    if (!s) { s = { wrap: mk('div', 'hm-grid-wrap'), emptySince: 0 }; boxState.set(box, s); }
    return s;
  }

  function buildGrid(box) {
    const s = stateOf(box);
    const wrap = s.wrap;
    if (wrap.previousElementSibling !== box) box.after(wrap);

    const cards = [...box.children].filter((c) => c.nodeType === 1);
    if (!cards.length) {
      if (!wrap.childElementCount) return;
      if (!s.emptySince) { s.emptySince = Date.now(); setTimeout(gridify, EMPTY_GRACE + 50); return; }
      if (Date.now() - s.emptySince < EMPTY_GRACE) return;
      wrap.replaceChildren();
      s.emptySince = 0;
      return;
    }
    s.emptySince = 0;

    const wanted = [];
    const seen = new Set();
    for (const c of cards) {
      const href = hrefOf(c);
      if (!href || seen.has(href)) continue;
      seen.add(href);

      let d;
      try { d = parseCard(c); } catch (e) { console.warn('[HMT] gagal parse kartu', e, c); continue; }
      if (!d) continue;

      const sig = cardSig(d);
      let entry = cardCache.get(href);
      if (!entry || entry.sig !== sig) {
        const el = makeCard(d);
        if (entry) { // data berubah: pertahankan <img> lama yang sudah termuat
          const oldImg = entry.el.querySelector('img');
          const newImg = el.querySelector('img');
          if (oldImg && newImg && oldImg.getAttribute('src')) newImg.replaceWith(oldImg);
        }
        entry = { el, sig };
        cardCache.set(href, entry);
      } else {
        const img = entry.el.querySelector('img');
        if (img && !img.getAttribute('src') && d.src) { img.style.visibility = ''; img.src = d.src; }
      }
      wanted.push(entry.el);
    }
    if (!wanted.length) return;

    // reconcile: hanya ubah DOM kalau memang berbeda
    const cur = wrap.children;
    let same = cur.length === wanted.length;
    for (let i = 0; same && i < wanted.length; i++) if (cur[i] !== wanted[i]) same = false;
    if (same) return;

    const keep = new Set(wanted);
    for (const ch of [...cur]) if (!keep.has(ch)) ch.remove();
    wanted.forEach((el, i) => {
      if (wrap.children[i] !== el) wrap.insertBefore(el, wrap.children[i] || null);
    });

    if (cardCache.size > 600) {
      for (const [k, v] of cardCache) if (!keep.has(v.el)) cardCache.delete(k);
    }
  }

  function gridify() {
    document.querySelectorAll('.gallery-content').forEach(buildGrid);
    // buang grid yatim kalau container aslinya diganti oleh situs (kartu sudah dipindah lewat cache)
    document.querySelectorAll('.hm-grid-wrap').forEach((w) => {
      const p = w.previousElementSibling;
      if (!p || !p.classList.contains('gallery-content')) w.remove();
    });
    applyTagFilter();
    romajiApply();
  }


  /* ====================================================================
   * FILTER TAG (panel samping, Alt+T)
   * Pembuat query pencarian: pilih tag (sertakan / kecualikan), lalu tombol Cari mengisi
   * kolom search situs dan menjalankannya, jadi hasilnya dari SELURUH galeri (bukan hanya halaman ini).
   * ==================================================================== */
  const tfNorm = (t) => String(t || '').replace(/[\u2640\u2642]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const tfSplit = (k) => { const i = k.indexOf(':'); return i < 0 ? ['tag', k] : [k.slice(0, i), k.slice(i + 1)]; };

  // kunci tag lengkap dengan namespace, mis. "female:big breasts"; tag tanpa namespace -> "tag:..."
  function tfKeyFromAnchor(a) {
    const t = txt(a);
    if (!t || t === '...') return '';
    const m = (a.getAttribute('href') || '').match(/\/tag\/([^/?#]+?)-all\.html/);
    if (m) {
      try {
        const k = tfNorm(decodeURIComponent(m[1]));
        if (k) return k.includes(':') ? k : 'tag:' + k;
      } catch {}
    }
    const name = tfNorm(t);
    return name ? (/\u2640/.test(t) ? 'female:' : /\u2642/.test(t) ? 'male:' : 'tag:') + name : '';
  }

  const tfIncL = () => (Array.isArray(state.tfInc) ? state.tfInc : []);
  const tfExcL = () => (Array.isArray(state.tfExc) ? state.tfExc : []);
  const tfSave = (k, arr) => { state[k] = arr; set(k, arr); };
  const tfCount = () => tfIncL().length + tfExcL().length;
  const tfQuery = () => [...tfIncL(), ...tfExcL().map((k) => '-' + k)].map((t) => t.replace(/ /g, '_')).join(' ');

  let tfEl = null, tfUi = null, tfSig = '', tfLiveT = 0, tfMode = 'inc', tfSaveT = 0;

  // Kosakata tag: diingat lintas halaman. tfSeen = id galeri yang sudah dihitung.
  const tfVocab = (() => { const v = get('tfVocab2', {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; })();
  let tfSeenArr = (() => { const v = get('tfSeen2', []); return Array.isArray(v) ? v : []; })();
  const tfSeen = new Set(tfSeenArr);
  function tfLearn(cards) {
    let dirty = false;
    for (const c of cards) {
      if (!c.dataset.tfk) continue;
      const id = c.dataset.gid || gidOfHref(c.getAttribute('href'));
      if (!id || tfSeen.has(id)) continue;
      tfSeen.add(id); tfSeenArr.push(id);
      new Set(c.dataset.tfk.split('|')).forEach((t) => { if (t) tfVocab[t] = (tfVocab[t] || 0) + 1; });
      dirty = true;
    }
    if (dirty && !tfSaveT) tfSaveT = setTimeout(() => {
      tfSaveT = 0;
      if (tfSeenArr.length > 6000) tfSeenArr = tfSeenArr.slice(-5000);
      const keys = Object.keys(tfVocab);
      if (keys.length > 4000) keys.sort((a, b) => tfVocab[a] - tfVocab[b]).slice(0, keys.length - 3000).forEach((k) => delete tfVocab[k]);
      set('tfVocab2', tfVocab); set('tfSeen2', tfSeenArr);
    }, 600);
  }

  function updateTfBadge() {
    const a = document.querySelector('#hmt-tf-nav a');
    if (!a) return;
    const n = tfCount();
    const t = '🏷 Filter' + (n ? ' (' + n + ')' : '');
    if (a.textContent !== t) a.textContent = t;
  }

  // dipanggil tiap grid dibangun ulang: pelajari tag baru + segarkan panel kalau terbuka
  function applyTagFilter() {
    tfLearn(document.querySelectorAll('.hm-card'));
    updateTfBadge();
    if (tfEl && tfEl.classList.contains('open')) { clearTimeout(tfLiveT); tfLiveT = setTimeout(tfLive, 150); }
  }

  function tfPageKeys() {
    const m = new Map();
    document.querySelectorAll('.hm-card').forEach((c) => {
      if (!c.dataset.tfk) return;
      new Set(c.dataset.tfk.split('|')).forEach((t) => { if (t) m.set(t, (m.get(t) || 0) + 1); });
    });
    return m;
  }
  function tfSigNow() {
    const c = document.querySelectorAll('.hm-card');
    return c.length + '|' + (c.length ? c[0].href + '|' + c[c.length - 1].href : '');
  }

  function tfChip(key, cls, extra, onClick) {
    const [ns, name] = tfSplit(key);
    const b = mk('button', 'tf-chip' + (cls ? ' ' + cls : '')); b.type = 'button'; b.title = key;
    if (ns !== 'tag') b.appendChild(mk('span', 'tf-ns ' + (ns === 'female' ? 'f' : ns === 'male' ? 'm' : 'o'), ns === 'female' ? '♀' : ns === 'male' ? '♂' : ns));
    b.appendChild(mk('span', '', name));
    if (extra != null) b.appendChild(mk('small', '', String(extra)));
    b.addEventListener('click', onClick);
    return b;
  }

  function tfChanged() { updateTfBadge(); renderTf(); }
  const tfListKey = (mode) => (mode === 'exc' ? 'tfExc' : 'tfInc');

  function tfPut(key, mode) {
    tfSave('tfInc', tfIncL().filter((x) => x !== key));
    tfSave('tfExc', tfExcL().filter((x) => x !== key));
    tfSave(tfListKey(mode), [...(mode === 'exc' ? tfExcL() : tfIncL()), key]);
  }
  function tfRemove(key) {
    tfSave('tfInc', tfIncL().filter((x) => x !== key));
    tfSave('tfExc', tfExcL().filter((x) => x !== key));
  }
  function tfToggle(key) {
    const cur = tfMode === 'exc' ? tfExcL() : tfIncL();
    if (cur.includes(key)) tfRemove(key); else tfPut(key, tfMode);
    tfChanged();
  }

  // isi dari kolom search situs (mis. saat sedang di halaman tag/pencarian)
  function tfPreload() {
    if (tfCount()) return;
    const box = document.getElementById('query-input');
    const v = box ? box.value.trim() : '';
    if (!v) return;
    const inc = [], exc = [];
    v.split(/\s+/).forEach((term) => {
      const neg = term.startsWith('-');
      const k = tfNorm(neg ? term.slice(1) : term);
      if (!k || !k.includes(':') || k.startsWith(':') || k.endsWith(':')) return;
      (neg ? exc : inc).push(k);
    });
    if (inc.length) tfSave('tfInc', inc);
    if (exc.length) tfSave('tfExc', exc);
  }

  function tfGoSearch() {
    const q = tfQuery();
    if (!q) { toast('Pilih tag dulu'); return; }
    const inp = document.getElementById('query-input');
    const btn = document.getElementById('search-button')
      || [...document.querySelectorAll('#search button, #search input[type=submit], .header-table button, .header-table input[type=submit]')]
        .find((b) => /search/i.test(b.textContent || b.value || ''));
    const before = location.href;
    if (inp && btn) {
      inp.value = q;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      btn.click();
      // kalau tombol situs tidak memindah halaman, pakai URL pencarian langsung
      setTimeout(() => { if (location.href === before) location.href = '/search.html?' + encodeURIComponent(q); }, 600);
    } else {
      location.href = '/search.html?' + encodeURIComponent(q);
    }
  }

  function renderTfTags() {
    if (!tfUi) return;
    tfSig = tfSigNow();
    const raw = tfUi.input.value;
    const q = tfNorm(raw);
    tfUi.x.classList.toggle('on', !!raw);
    const inc = new Set(tfIncL()), exc = new Set(tfExcL());
    const page = tfPageKeys();
    const pageTags = [...page].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const others = Object.entries(tfVocab).filter(([k]) => !page.has(k)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const match = ([k]) => !q || k.includes(q);
    const chip = ([k, n]) => tfChip(k, inc.has(k) ? 'req' : exc.has(k) ? 'hide' : '', n, () => tfToggle(k));

    // saran tag baru (kalau yang diketik belum dikenal)
    const known = (name) => pageTags.some(([k]) => tfSplit(k)[1] === name) || others.some(([k]) => tfSplit(k)[1] === name);
    let sug = [];
    if (q) {
      const i = q.indexOf(':');
      if (i > 0 && i < q.length - 1) sug = [q];
      else if (i < 0 && !known(q)) sug = ['female:' + q, 'male:' + q, 'tag:' + q];
    }
    tfUi.sugWrap.style.display = sug.length ? '' : 'none';
    tfUi.sug.replaceChildren(...sug.map((k) => tfChip(k, '', null, () => { tfPut(k, tfMode); tfUi.input.value = ''; tfChanged(); })));

    const listA = pageTags.filter(match).slice(0, 250).map(chip);
    tfUi.tags.replaceChildren(...(listA.length ? listA : [mk('div', 'tf-empty', pageTags.length ? (q ? T('Tidak ada yang cocok di halaman ini.') : '') : T('Belum ada tag terbaca di halaman ini'))]));
    tfUi.tagsCnt.textContent = pageTags.length ? T('{0} tag', pageTags.length, pageTags.length === 1 ? '' : 's') : '';

    const matchB = others.filter(match);
    const listB = matchB.slice(0, q ? 250 : 80).map(chip);
    tfUi.more.style.display = listB.length ? '' : 'none';
    tfUi.tags2.replaceChildren(...listB);
    tfUi.tags2Cnt.textContent = matchB.length > listB.length ? T('{0} dari {1} (ketik untuk cari)', listB.length, matchB.length) : T('{0} tag', matchB.length, matchB.length === 1 ? '' : 's');

    const names = new Set(pageTags.map((x) => x[0]));
    others.slice(0, 300).forEach(([k]) => names.add(k));
    tfUi.dl.replaceChildren(...[...names].slice(0, 500).map((k) => { const o = document.createElement('option'); o.value = k; return o; }));
  }

  function tfLive() {
    if (!tfUi || !tfEl || !tfEl.classList.contains('open')) return;
    if (tfSigNow() !== tfSig) renderTfTags();
  }

  function renderTf() {
    if (!tfUi) return;
    const inc = tfIncL(), exc = tfExcL();
    const n = inc.length + exc.length;
    tfUi.tgt.forEach((b) => b.classList.toggle('on', b.dataset.v === tfMode));
    tfUi.hint.style.display = n ? 'none' : '';
    tfUi.active.style.display = n ? '' : 'none';
    const rm = (cls) => (k) => tfChip(k, cls, '×', () => { tfRemove(k); tfChanged(); });
    tfUi.chips.replaceChildren(...inc.map(rm('req')), ...exc.map(rm('hide')));
    tfUi.code.textContent = tfQuery();
    tfUi.go.textContent = n ? T('🔍 Cari ({0})', n) : T('🔍 Cari');
    tfUi.go.classList.toggle('dis', !n);
    tfUi.clear.style.visibility = n ? '' : 'hidden';
    renderTfTags();
  }

  function buildTf() {
    tfEl = mk('div'); tfEl.id = 'hmt-tf';
    tfEl.setAttribute('role', 'dialog'); tfEl.setAttribute('aria-label', T('Filter Tag'));

    const head = mk('div', 'tf-head');
    const close = mk('button', 'tf-close', '✕'); close.type = 'button'; close.title = T('Tutup (Esc)');
    close.addEventListener('click', closeTf);
    head.append(mk('div', 'tf-title', T('Filter Tag')), close);

    const top = mk('div', 'tf-top');
    const seg = mk('div', 'tf-seg');
    const tgt = [['inc', 'Sertakan'], ['exc', 'Kecualikan']].map(([v, l]) => {
      const b = mk('button'); b.type = 'button'; b.dataset.v = v;
      b.append(mk('i'), document.createTextNode(T(l)));
      b.addEventListener('click', () => { tfMode = v; tfUi.tgt.forEach((x) => x.classList.toggle('on', x.dataset.v === v)); });
      seg.appendChild(b); return b;
    });
    const sbox = mk('div', 'tf-search');
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'tf-in'; input.placeholder = T('Cari tag… (mis. female:insect)');
    input.setAttribute('list', 'hmt-tf-dl'); input.autocomplete = 'off'; input.spellcheck = false;
    const dl = document.createElement('datalist'); dl.id = 'hmt-tf-dl';
    const x = mk('button', 'tf-x', '✕'); x.type = 'button'; x.title = T('Bersihkan');
    x.addEventListener('click', () => { input.value = ''; renderTfTags(); input.focus(); });
    input.addEventListener('input', renderTfTags);
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const q = tfNorm(input.value);
      if (!q) { tfGoSearch(); return; }
      let key = '';
      const i = q.indexOf(':');
      if (i > 0 && i < q.length - 1) key = q;
      else {
        const cands = [...new Set([...tfPageKeys().keys(), ...Object.keys(tfVocab)])].filter((k) => tfSplit(k)[1] === q);
        cands.sort((a, b) => (tfVocab[b] || 0) - (tfVocab[a] || 0));
        key = cands[0] || '';
      }
      if (!key) { toast('Tag belum dikenal. Pilih namespace di bawah (♀ / ♂ / tag).'); return; }
      tfPut(key, tfMode); input.value = ''; tfChanged();
    });
    sbox.append(input, x, dl);
    top.append(seg, sbox);

    const scroll = mk('div', 'tf-scroll');
    const hint = mk('div', 'tf-hint', T('Pilih mode di atas, klik tag di bawah, lalu tekan Cari. Hasilnya dari seluruh galeri, bukan hanya halaman ini.'));

    const active = mk('div', 'tf-active');
    const chips = mk('div', 'tf-chips');
    const code = mk('div', 'tf-code');
    active.append(chips, code);

    const sugWrap = mk('div'); sugWrap.style.marginBottom = '14px';
    const sl = mk('div', 'tf-lab'); sl.append(mk('span', '', T('Tambah tag baru')), mk('em', '', T('pilih jenisnya')));
    const sug = mk('div', 'tf-chips');
    sugWrap.append(sl, sug);

    const tl = mk('div', 'tf-lab'); const tagsCnt = mk('em');
    tl.append(mk('span', '', T('Tag di halaman ini')), tagsCnt);
    const tagsBox = mk('div', 'tf-chips');
    const more = mk('div'); more.style.marginTop = '16px';
    const tl2 = mk('div', 'tf-lab'); const tags2Cnt = mk('em');
    tl2.append(mk('span', '', T('Dari halaman lain')), tags2Cnt);
    const tagsBox2 = mk('div', 'tf-chips');
    more.append(tl2, tagsBox2);
    scroll.append(hint, active, sugWrap, tl, tagsBox, more);

    const foot = mk('div', 'tf-foot');
    const clear = mk('button', 'tf-clear', T('Kosongkan')); clear.type = 'button';
    clear.addEventListener('click', () => { tfSave('tfInc', []); tfSave('tfExc', []); tfChanged(); });
    const go = mk('button', 'tf-go', T('🔍 Cari')); go.type = 'button';
    go.addEventListener('click', tfGoSearch);
    foot.append(clear, go);

    tfEl.append(head, top, scroll, foot);
    document.body.appendChild(tfEl);
    tfUi = { input, x, dl, hint, active, chips, code, sugWrap, sug, tags: tagsBox, tagsCnt, more, tags2: tagsBox2, tags2Cnt, tgt, clear, go };
  }

  function openTf() {
    if (isReader) return;
    if (!tfEl) buildTf();
    else if (!tfEl.isConnected) document.body.appendChild(tfEl);
    tfEl.classList.add('open');
    tfPreload();
    applyTagFilter();
    renderTf();
    updateTfBadge();
  }
  function closeTf() { if (tfEl) tfEl.classList.remove('open'); }
  function toggleTf() { if (tfEl && tfEl.classList.contains('open')) closeTf(); else openTf(); }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tfEl && tfEl.classList.contains('open') && !(overlay && overlay.classList.contains('open'))) {
      if (document.getElementById('hmt-dl')) return;
      closeTf(); return;
    }
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyT' && !isReader) { e.preventDefault(); e.stopImmediatePropagation(); toggleTf(); }
  }, true);

  /* ====================================================================
   * ROMAJI: tulisan Jepang di judul -> huruf latin
   * Kana (hiragana/katakana) diubah offline. Kanji memakai kamus kuromoji yang dimuat dari CDN
   * (hanya kalau "Ubah kanji juga" aktif); sebelum kamus siap, kanji dibiarkan apa adanya.
   * ==================================================================== */
  const RM_B = {};
  ('あa いi うu えe おo かka きki くku けke こko さsa しshi すsu せse そso たta ちchi つtsu てte とto ' +
   'なna にni ぬnu ねne のno はha ひhi ふfu へhe ほho まma みmi むmu めme もmo やya ゆyu よyo ' +
   'らra りri るru れre ろro わwa ゐi ゑe をo がga ぎgi ぐgu げge ごgo ざza じji ずzu ぜze ぞzo ' +
   'だda ぢji づzu でde どdo ばba びbi ぶbu べbe ぼbo ぱpa ぴpi ぷpu ぺpe ぽpo ゔvu ' +
   'ぁa ぃi ぅu ぇe ぉo ゃya ゅyu ょyo ゎwa ゕka ゖke').split(' ').forEach((t) => { RM_B[t[0]] = t.slice(1); });
  const RM_SY = { 'ゃ': 'a', 'ゅ': 'u', 'ょ': 'o' };
  const RM_SV = { 'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o' };
  const RM_PUNCT = { '【': '[', '】': ']', '「': '"', '」': '"', '『': '"', '』': '"', '、': ', ', '。': '. ', '・': ' ', '〜': '~', '　': ' ' };
  const RM_JP = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f々〆]/;
  const RM_KANARUN = /[\u3041-\u3096\u30a1-\u30fa\u30fc]+/g;
  const RM_PART = { 'は': 'wa', 'へ': 'e', 'を': 'o' };
  const rmCache = new Map();
  let kmWorker = null, kmState = 'idle'; // idle | loading | ready | error
  const kmPending = new Map(), kmInflight = new Map(); // teks asli -> teks NFKC
  let kmFlushT = 0, kmApplyT = 0;

  const rmKata2Hira = (t) => t.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const rmCap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);

  function rmCombine(base, n) {
    const y = RM_SY[n];
    if (y) {
      if (/^(shi|chi|ji)$/.test(base)) return base.slice(0, -1) + y;
      if (/^(ki|gi|ni|hi|bi|pi|mi|ri|fu|te|de|vu)$/.test(base)) return base.slice(0, -1) + 'y' + y;
      return null;
    }
    const v = RM_SV[n];
    if (!v) return null;
    if (base === 'u') return v === 'u' ? null : 'w' + v;
    if (base === 'i') return v === 'e' ? 'ye' : null;
    if (/^(fu|vu|tsu|te|de|to|do|shi|ji|chi|su|zu|ku|gu)$/.test(base)) return base.replace(/[aiueo]$/, '') + v;
    return null;
  }

  // satu rangkaian kana -> romaji (Hepburn, tanpa makron)
  function rmKana(src) {
    const s = rmKata2Hira(src);
    let out = '', i = 0, gem = false;
    const push = (r) => { if (gem) { r = r.startsWith('ch') ? 't' + r : r.charAt(0) + r; gem = false; } out += r; };
    while (i < s.length) {
      const c = s[i];
      if (c === 'っ') { gem = true; i++; continue; }
      if (c === 'ー') { const m = out.match(/[aiueo]$/); if (m) out += m[0]; i++; continue; }
      if (c === 'ん') { const nx = s[i + 1]; push(nx && 'あいうえおやゆよ'.includes(nx) ? "n'" : 'n'); i++; continue; }
      const base = RM_B[c];
      if (base !== undefined) {
        const n = s[i + 1];
        const comb = n ? rmCombine(base, n) : null;
        if (comb) { push(comb); i += 2; } else { push(base); i++; }
        continue;
      }
      gem = false; out += c; i++;
    }
    return out;
  }
  const rmSimple = (r) => (state.romajiLong === 'keep' ? r : r.replace(/ou/g, 'o').replace(/oo/g, 'o').replace(/uu/g, 'u'));
  const rmChunk = (str) => str.replace(RM_KANARUN, (run) => rmSimple(rmKana(run)));
  const rmPunct = (t) => t.replace(/[【】「」『』、。・〜　]/g, (c) => RM_PUNCT[c]);
  const rmFinish = (r) => r.replace(/\s{2,}/g, ' ').trim();

  function rmKanaOnly(text) {
    const t = text.normalize('NFKC');
    return rmFinish(rmPunct(t.replace(RM_KANARUN, (run) => rmCap(rmSimple(rmKana(run))))));
  }

  // token dari worker: { s: surface, r: reading, p: pos, d: pos_detail_1, w: word_position }
  function rmFromTokens(t, toks) {
    let out = '', pos = 0, prevJp = false;
    for (const k of toks) {
      const surf = k.s;
      const start = k.w - 1;
      const gap = t.slice(pos, start);
      pos = start + surf.length;
      const jp = RM_JP.test(surf);
      const particle = k.p === '助詞';
      const attach = k.p === '助動詞' || k.d === '接尾';
      let piece;
      if (jp) {
        if (particle && RM_PART[surf]) piece = RM_PART[surf];
        else piece = rmChunk(k.r && k.r !== '*' ? k.r : surf);
      } else piece = rmPunct(surf);
      const sep = gap || (jp && prevJp && !attach ? ' ' : '');
      const newWord = !out || sep !== '' || !prevJp;
      if (jp && newWord && !particle) piece = rmCap(piece);
      out += sep + piece;
      prevJp = jp;
    }
    return rmFinish(out);
  }

  // Hasil lengkap (dengan kanji) datang async dari worker. Selama belum ada, tampilkan versi kana saja.
  function rmConv(text) {
    if (!RM_JP.test(text)) return text;
    const hit = rmCache.get(text);
    if (hit !== undefined) return hit;
    const useDict = state.romajiKanji && kmState === 'ready' && kmWorker && !/[\ud800-\udfff]/.test(text);
    let r;
    try { r = rmKanaOnly(text); } catch (e) { console.warn('[HMT] romaji gagal', e); r = text; }
    if (useDict) { rmQueue(text); return r; }
    // kamus belum siap tapi diharapkan -> jangan di-cache, hitung ulang nanti
    if (!(state.romajiKanji && (kmState === 'idle' || kmState === 'loading'))) {
      rmCache.set(text, r);
      if (rmCache.size > 3000) rmCache.clear();
    }
    return r;
  }

  function rmQueue(text) {
    if (kmPending.has(text) || kmInflight.has(text)) return;
    kmPending.set(text, text.normalize('NFKC'));
    if (!kmFlushT) kmFlushT = setTimeout(() => {
      kmFlushT = 0;
      if (!kmWorker || !kmPending.size) return;
      const batch = [...kmPending];
      kmPending.clear();
      batch.forEach(([o, n]) => kmInflight.set(o, n));
      kmWorker.postMessage({ type: 'tok', texts: [...new Set(batch.map((x) => x[1]))] });
    }, 0);
  }

  function kmOnTok(out) {
    for (const [orig, norm] of [...kmInflight]) {
      if (!(norm in out)) continue;
      kmInflight.delete(orig);
      let r;
      try { r = out[norm] ? rmFromTokens(norm, out[norm]) : rmKanaOnly(orig); }
      catch (e) { r = rmKanaOnly(orig); }
      rmCache.set(orig, r);
    }
    if (rmCache.size > 3000) rmCache.clear();
    clearTimeout(kmApplyT);
    kmApplyT = setTimeout(romajiApply, 30);
  }

  // Kode worker: kuromoji dijalankan di thread terpisah supaya halaman tidak membeku saat kamus dibangun.
  const KM_GLUE = [
    ';(function () {',
    '  var tk = null;',
    '  self.onmessage = function (e) {',
    '    var m = e.data;',
    "    if (m.type === 'init') {",
    '      try {',
    '        kuromoji.builder({ dicPath: m.dicPath }).build(function (err, t) {',
    "          if (err || !t) { self.postMessage({ type: 'error', msg: 'kamus gagal diunduh (' + String((err && err.message) || err || 'jaringan/CORS') + ')' }); return; }",
    "          tk = t; self.postMessage({ type: 'ready' });",
    '        });',
    "      } catch (x) { self.postMessage({ type: 'error', msg: 'build: ' + String((x && x.message) || x) }); }",
    "    } else if (m.type === 'tok' && tk) {",
    '      var out = {};',
    '      for (var i = 0; i < m.texts.length; i++) {',
    '        var txt = m.texts[i];',
    '        try {',
    '          out[txt] = tk.tokenize(txt).map(function (k) { return { s: k.surface_form, r: k.reading, p: k.pos, d: k.pos_detail_1, w: k.word_position }; });',
    '        } catch (x) { out[txt] = null; }',
    '      }',
    "      self.postMessage({ type: 'tok', out: out });",
    '    }',
    '  };',
    '})();',
  ].join('\n');

  // Muat kuromoji + kamus (di worker). Beberapa mirror dicoba berurutan; kegagalan dicatat di Console ([HMT]).
  function kmLoad() {
    if (kmState !== 'idle') return;
    kmState = 'loading';
    toast('Memuat kamus kanji… (pertama kali agak lama, halaman tetap bisa dipakai)', { ms: 3500 });
    const bases = [
      'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/',
      'https://fastly.jsdelivr.net/npm/kuromoji@0.1.2/',
      'https://gcore.jsdelivr.net/npm/kuromoji@0.1.2/',
      'https://unpkg.com/kuromoji@0.1.2/',
    ];
    const errs = [];
    const fail = () => {
      kmState = 'error';
      console.warn('[HMT] kamus kanji gagal dimuat:', errs);
      rmCache.clear(); romajiApply();
      toast(T('Gagal memuat kamus kanji ({0}). Kalau diblokir ekstensi pemblokir iklan, izinkan cdn.jsdelivr.net. Detail di Console, cari [HMT].', tErr(errs[errs.length - 1] || 'tidak diketahui')), { type: 'err', ms: 15000 });
    };
    const tryBase = (n) => {
      if (n >= bases.length) return fail();
      const host = bases[n].split('/')[2];
      let settled = false, w = null, url = '', timer = 0;
      const next = (why) => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        if (w) { try { w.terminate(); } catch {} }
        if (url) URL.revokeObjectURL(url);
        console.warn('[HMT] ' + host + ': ' + why);
        errs.push(host + ': ' + why);
        tryBase(n + 1);
      };
      timer = setTimeout(() => next('timeout (90 detik)'), 90000);
      fetch(bases[n] + 'build/kuromoji.js')
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then((code) => {
          if (settled) return;
          url = URL.createObjectURL(new Blob([code, '\n', KM_GLUE], { type: 'text/javascript' }));
          w = new Worker(url);
          w.onmessage = (e) => {
            const m = e.data || {};
            if (m.type === 'ready') {
              if (settled) return;
              settled = true; clearTimeout(timer);
              URL.revokeObjectURL(url);
              kmWorker = w; kmState = 'ready';
              rmCache.clear(); romajiApply();
              toast('Kamus kanji siap', { type: 'ok', ms: 2500 });
            } else if (m.type === 'error') next(m.msg || 'error');
            else if (m.type === 'tok') kmOnTok(m.out || {});
          };
          w.onerror = (e) => next('worker: ' + ((e && e.message) || 'error'));
          w.postMessage({ type: 'init', dicPath: bases[n] + 'dict/' });
        })
        .catch((e) => next('kuromoji.js: ' + ((e && e.message) || e)));
    };
    tryBase(0);
  }

  // Terapkan ke judul di halaman. Idempotent: teks asli disimpan di data-rm-orig.
  const RM_SEL = '.hm-title, .hm-sub, .hm-it, .hm-ia, #gallery-brand a';
  function romajiApply() {
    if (isReader) return;
    const on = !!state.romaji;
    document.querySelectorAll(RM_SEL).forEach((el) => {
      if (el.children.length) return;
      const cur = el.textContent;
      let o = el.dataset.rmOrig;
      if (o === undefined || (cur !== o && cur !== el.dataset.rmOut)) { o = cur; el.dataset.rmOrig = o; }
      const want = on ? rmConv(o) : o;
      el.dataset.rmOut = want;
      if (cur !== want) el.textContent = want;
    });
  }

  onReady(() => {
    if (isReader) return;
    romajiApply();
    if (state.romaji && state.romajiKanji) setTimeout(kmLoad, 800);
  });

  /* ====================================================================
   * Deteksi latar terang -> gelapkan (tidak bergantung nama class situs)
   * ==================================================================== */
  const SKIP_DARK = new Set(['IMG', 'INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'SCRIPT', 'STYLE', 'LINK', 'META', 'VIDEO', 'CANVAS', 'PICTURE', 'SOURCE', 'IFRAME']);

  // Kembalikan warna latar (string) kalau elemen berlatar terang & tidak transparan, selain itu null.
  function lightBg(el) {
    const c = getComputedStyle(el).backgroundColor;
    const m = c && c.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/);
    if (!m) return null;
    const a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]);
    if (a < 0.5) return null;
    const lum = (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255;
    return lum > 0.72 ? c : null;
  }

  function darkenTree(rootEl) {
    if (!state.dark || !rootEl || rootEl.nodeType !== 1 || !rootEl.isConnected) return;
    const skipSel = state.grid ? '#hmt-overlay, #hmt-dl, #hmt-preview, .hm-thumbs, .hm-grid-wrap, .gallery-content' : '#hmt-overlay, #hmt-dl, #hmt-preview, .hm-thumbs, .hm-grid-wrap';
    const all = [rootEl, ...rootEl.querySelectorAll('*')];
    for (const el of all) {
      if (!(el instanceof HTMLElement) || SKIP_DARK.has(el.tagName) || el.classList.contains('hmt-dk') || el.closest(skipSel)) continue;
      const bg = lightBg(el);
      if (bg) { el.dataset.hmtBg = bg; el.classList.add('hmt-dk'); }
    }
  }

  let rescanQueued = false;
  function rescanDark() {
    if (rescanQueued) return;
    rescanQueued = true;
    requestAnimationFrame(() => { rescanQueued = false; if (document.body) darkenTree(document.body); });
  }

  /* ---------- Dump diagnostik (tombol di panel Pengaturan) ---------- */
  function elPath(el) {
    const parts = [];
    for (let e = el, i = 0; e && e !== document.body && i < 6; e = e.parentElement, i++) {
      const cls = [...e.classList].filter((c) => !/^(hmt-|hm-)/.test(c)).slice(0, 3).map((c) => '.' + c).join('');
      parts.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + cls);
    }
    return parts.join(' > ');
  }

  function openTag(el) {
    const h = el.cloneNode(false).outerHTML;
    return h.length > 200 ? h.slice(0, 200) + '…' : h;
  }

  function buildDump() {
    const lines = ['URL: ' + location.href, 'Dark: ' + state.dark + ' | Grid: ' + state.grid + ' | v2.5', ''];
    lines.push('== Struktur atas body ==');
    [...document.body.children].slice(0, 25).forEach((e) => {
      const r = e.getBoundingClientRect();
      lines.push(`${elPath(e) || e.tagName.toLowerCase()} | ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    lines.push('', '== Elemen berlatar terang (warna asli | ukuran | path | tag pembuka) ==');
    let n = 0;
    for (const el of document.body.querySelectorAll('*')) {
      if (!(el instanceof HTMLElement) || SKIP_DARK.has(el.tagName) || el.closest('#hmt-overlay, #hmt-dl, .hm-grid-wrap')) continue;
      const bg = el.dataset.hmtBg || lightBg(el);
      if (!bg) continue;
      const r = el.getBoundingClientRect();
      lines.push(`${bg} | ${Math.round(r.width)}x${Math.round(r.height)} | ${elPath(el)} | ${openTag(el)}`);
      if (++n >= 120) { lines.push('... (dipotong)'); break; }
    }
    if (!n) lines.push('(tidak ada)');
    return lines.join('\n');
  }

  function copyDump(btn) {
    const text = buildDump();
    console.log('[HMT dump]\n' + text);
    const done = (ok) => {
      btn.textContent = T(ok ? 'Tersalin ✓' : 'Lihat console (F12)');
      setTimeout(() => { btn.textContent = T('Salin dump'); }, 2500);
    };
    const fallback = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        ta.remove(); done(ok);
      } catch (e) { done(false); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), fallback);
    else fallback();
  }

  /* ====================================================================
   * URL gambar reader (dipakai reader webtoon, thumbnail besar, dan hover preview)
   * ==================================================================== */
  // Daftar URL kandidat untuk satu gambar. Dicoba berurutan kalau ada yang gagal.
  // Catatan: subdomain gambar penuh = w{n} (webp) / a{n} (avif), BUKAN "aa".
  function candidates(f) {
    const gg = window.gg;
    const id = window.galleryinfo && window.galleryinfo.id;
    const exts = [];
    if (f.haswebp !== 0) exts.push('webp');
    if (f.hasavif) exts.push('avif');
    if (!exts.length) exts.push('webp');

    const out = [];
    const push = (u) => { if (u && !out.includes(u)) out.push(u); };

    exts.forEach((ext) => {
      if (typeof window.url_from_url_from_hash === 'function') {
        try { push(window.url_from_url_from_hash(id, f, ext)); } catch (e) { /* lanjut */ }
      }
      try {
        const path = gg.b + gg.s(f.hash) + '/' + f.hash + '.' + ext;
        const n = parseInt(gg.s(f.hash), 10);
        const prefix = ext === 'webp' ? 'w' : 'a';
        const first = 1 + gg.m(n);
        [first, 1, 2, 3].forEach((k) => push(`https://${prefix}${k}.gold-usergeneratedcontent.net/${path}`));
      } catch (e) { /* gg tidak lengkap */ }
    });
    return out;
  }

  /* ====================================================================
   * THUMBNAIL BESAR (halaman galeri): ganti strip thumbnail kecil dengan grid
   * besar yang memakai gambar reader.
   * ==================================================================== */
  // Cari kumpulan thumbnail asli: tautan ke /reader/ yang berisi <img>, dikelompokkan per induk.
  function findThumbGroup() {
    const as = [...document.querySelectorAll('a[href*="/reader/"]')]
      .filter((a) => a.querySelector('img') && !a.closest('.hm-thumbs, .hm-grid-wrap, .gallery-content, #hmt-overlay'));
    if (as.length < 2) return null;

    const groups = new Map();
    for (const a of as) {
      const p = a.parentElement;
      if (!p) continue;
      const k = p.tagName + '|' + p.className;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(a);
    }
    let best = null;
    for (const g of groups.values()) if (!best || g.length > best.length) best = g;
    if (!best || best.length < 2) return null;

    let lca = best[0].parentElement;
    while (lca && !best.every((a) => lca.contains(a))) lca = lca.parentElement;
    if (!lca || lca === document.body || lca === root || lca.matches('.container, .content, .top-content, .bottom-content')) return null;
    return { anchors: best, lca };
  }

  let infoReqTimer = 0;
  function requestInfo() { // kalau situs belum memuat galleryinfo/gg, muat sendiri setelah jeda
    if (infoReqTimer) return;
    infoReqTimer = setTimeout(() => {
      const idm = location.pathname.match(/(\d+)\.html$/);
      const inject = (src) => {
        const s = document.createElement('script');
        s.src = src; s.onload = () => buildThumbs();
        (document.head || root).appendChild(s);
      };
      if (!window.galleryinfo && idm) {
        const ex = [...document.scripts].find((s) => /\/galleries\/\d+\.js/.test(s.src));
        inject(ex ? ex.src : `https://ltn.gold-usergeneratedcontent.net/galleries/${idm[1]}.js`);
      }
      if (!window.gg) {
        const ex = [...document.scripts].find((s) => /\/gg\.js/.test(s.src));
        inject(ex ? ex.src : 'https://ltn.gold-usergeneratedcontent.net/gg.js');
      }
    }, 2500);
  }

  function buildThumbs() {
    if (!isGallery || !state.thumbs) return;
    const info = window.galleryinfo;
    const gg = window.gg;
    if (!(info && info.files && info.files.length && gg && typeof gg.m === 'function')) { requestInfo(); return; }
    const g = findThumbGroup();
    if (!g) return;

    const idm = location.pathname.match(/(\d+)\.html$/);
    const gid = info.id || (idm && idm[1]) || '';
    const siteSrc = g.anchors.map((a) => {
      const im = a.querySelector('img');
      let s = im ? (im.getAttribute('data-src') || im.getAttribute('src') || '') : '';
      if (!s || s.startsWith('data:')) {
        const so = a.querySelector('source[data-srcset], source[srcset]');
        s = so ? ((so.getAttribute('data-srcset') || so.getAttribute('srcset') || '').trim().split(/\s+/)[0]) : '';
      }
      if (s.startsWith('data:')) s = '';
      if (s.startsWith('//')) s = 'https:' + s;
      return s;
    });

    const host = thumbHost || mk('div', 'hm-thumbs');
    const frag = document.createDocumentFragment();
    info.files.forEach((f, i) => {
      const a = mk('a', 'hm-th');
      a.href = `/reader/${gid}.html#${i + 1}`;
      a.dataset.i = String(i + 1);
      const urls = candidates(f);
      a._urls = urls;

      const img = document.createElement('img');
      img.loading = 'lazy'; img.decoding = 'async'; img.alt = '';
      if (f.width && f.height) {
        a.dataset.r = (f.width / f.height).toFixed(4);
        img.width = f.width; img.height = f.height;
        img.style.aspectRatio = `${f.width} / ${f.height}`;
      }
      const list = state.thumbReader ? urls : [siteSrc[i], ...urls].filter(Boolean);
      let k = 0;
      img.addEventListener('error', () => { if (++k < list.length) img.src = list[k]; });
      if (list.length) img.src = list[0];

      a.appendChild(img);
      a.appendChild(mk('span', 'hm-thn', String(i + 1)));
      frag.appendChild(a);
    });
    host.dataset.n = String(info.files.length);
    host.replaceChildren(frag);
    attachPreview(host);

    thumbHost = host;
    thumbOrig = g.lca;
    if (host.previousElementSibling !== g.lca) g.lca.after(host);
    apply();
  }

  function thumbsMaybe() {
    if (!isGallery || !state.thumbs) return;
    if (thumbHost && thumbHost.isConnected && thumbOrig && thumbOrig.isConnected) return;
    buildThumbs();
  }

  function rebuildThumbs() {
    hidePreview();
    if (thumbOrig) thumbOrig.classList.remove('hmt-hide');
    if (thumbHost) thumbHost.remove();
    thumbHost = null; thumbOrig = null;
    root.classList.remove('hm-thumbs-on');
    if (state.thumbs) buildThumbs();
    apply();
  }

  /* ====================================================================
   * HOVER PREVIEW (di atas thumbnail halaman galeri)
   * ==================================================================== */
  let pv = null, pvImg = null, pvLbl = null;
  let pvTimer = 0, pvCur = null, pvUrls = null, pvIdx = 0;
  const pvPt = { x: 0, y: 0 };

  function ensurePreview() {
    if (pv && pv.isConnected) return;
    pv = mk('div'); pv.id = 'hmt-preview';
    pvImg = document.createElement('img'); pvImg.alt = '';
    pvLbl = mk('div', 'hmt-pv-n');
    pv.append(pvImg, pvLbl);
    pvImg.addEventListener('error', () => { if (pvUrls && ++pvIdx < pvUrls.length) pvImg.src = pvUrls[pvIdx]; });
    pvImg.addEventListener('load', placePreview);
    document.body.appendChild(pv);
  }

  function placePreview() {
    if (!pvCur || !pv || pv.style.display !== 'block') return;
    const vw = window.innerWidth, vh = window.innerHeight, gap = 14;
    let r = +pvCur.dataset.r;
    if (!r) r = pvImg.naturalWidth && pvImg.naturalHeight ? pvImg.naturalWidth / pvImg.naturalHeight : 0.7;

    const rect = state.pvMode === 'cursor'
      ? { left: pvPt.x + 6, right: pvPt.x + 6, top: pvPt.y, bottom: pvPt.y }
      : pvCur.getBoundingClientRect();

    const spaceR = vw - rect.right - gap - 8;
    const spaceL = rect.left - gap - 8;
    const right = spaceR >= spaceL; // sisi yang lebih lega
    const availW = Math.max(120, (right ? spaceR : spaceL) - 2); // -2: border
    const maxH = Math.min(vh - 16, vh * state.pvSize / 100) - 2;
    const h = Math.min(maxH, availW / r);
    const w = h * r;

    pvImg.style.width = Math.round(w) + 'px';
    pvImg.style.height = Math.round(h) + 'px';
    const x = right ? rect.right + gap : rect.left - gap - w;
    const y = Math.min(Math.max(8, (rect.top + rect.bottom) / 2 - h / 2), vh - h - 8);
    pv.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  function showPreview(cell) {
    if (!state.pvOn || !cell || !cell.isConnected) return;
    ensurePreview();
    pvCur = cell;
    pvUrls = cell._urls || [];
    pvIdx = 0;
    const src = pvUrls[0] || '';
    if (src && pvImg.getAttribute('src') !== src) pvImg.src = src;
    pvLbl.textContent = cell.dataset.i + ' / ' + (cell.parentElement ? cell.parentElement.dataset.n || '' : '');
    pv.style.display = 'block';
    placePreview();
  }

  function hidePreview() {
    clearTimeout(pvTimer);
    pvCur = null;
    if (pv) pv.style.display = 'none';
  }

  function attachPreview(host) {
    if (host.dataset.pv) return;
    host.dataset.pv = '1';
    host.addEventListener('mouseover', (e) => {
      const c = e.target.closest && e.target.closest('.hm-th');
      clearTimeout(pvTimer);
      if (!c) { hidePreview(); return; }
      if (!state.pvOn) return;
      const shown = pv && pv.style.display === 'block';
      if (c === pvCur && shown) return;
      pvTimer = setTimeout(() => showPreview(c), shown ? 0 : state.pvDelay);
    });
    host.addEventListener('mouseleave', hidePreview);
    host.addEventListener('mousemove', (e) => {
      pvPt.x = e.clientX; pvPt.y = e.clientY;
      if (state.pvMode === 'cursor' && pvCur) placePreview();
    }, { passive: true });
  }
  window.addEventListener('scroll', () => { if (pvCur) hidePreview(); }, { passive: true });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePreview(); }, true);

  // Sembunyikan pagination di atas daftar (yang di bawah dibiarkan) dan footer "Donate BTC".
  let footerEl = null;
  let lastFooterScan = 0;
  function trimChrome(force) {
    const gc = document.querySelector('.gallery-content');
    if (gc) {
      document.querySelectorAll('.page-container').forEach((pc) => {
        // pagination yang posisinya sebelum daftar galeri = yang di atas
        if (!pc.classList.contains('hmt-hide') && (pc.compareDocumentPosition(gc) & Node.DOCUMENT_POSITION_FOLLOWING)) {
          pc.classList.add('hmt-hide');
        }
      });
    }

    if (footerEl && footerEl.isConnected) return;
    const now = Date.now();
    if (!force && now - lastFooterScan < 500) return;
    lastFooterScan = now;
    const body = document.body;
    if (!body) return;
    const tw = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (!/^\s*Donate\s*BTC/i.test(n.nodeValue)) continue;
      let t = n.parentElement;
      if (!t || t.closest('#hmt-overlay')) continue;
      while (t.parentElement && t.parentElement !== body && t.parentElement.textContent.trim().length < 100) t = t.parentElement;
      t.classList.add('hmt-hide');
      footerEl = t;
      break;
    }
  }

  if (!isReader) {
    // Dijalankan langsung di callback observer (microtask) -> selesai sebelum browser sempat menggambar.
    // stickyNavSync ikut dijalankan di sini (microtask, sebelum paint) supaya banner baru hasil render ulang situs langsung dikunci
    const run = () => { ensureStyle(); gridify(); trimChrome(); ensureNav(); thumbsMaybe(); stickyNavSync(); };

    new MutationObserver((muts) => {
      let need = false;
      for (const m of muts) {
        const t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (t && t.closest && t.closest('.hm-grid-wrap, .hm-thumbs, #hmt-preview, #hmt-overlay, #hmt-dl')) continue; // abaikan perubahan buatan sendiri
        need = true;
        m.addedNodes.forEach((n) => { if (n.nodeType === 1) darkenTree(n); });
      }
      if (need) run();
    }).observe(root, { childList: true, subtree: true });

    // stylesheet situs yang datang belakangan mengubah warna latar -> cek ulang
    document.addEventListener('load', (e) => { if (e.target && e.target.tagName === 'LINK') rescanDark(); }, true);

    onReady(() => { run(); trimChrome(true); darkenTree(document.body); trimmed = true; apply(); });

    // Situs mengganti class/style elemen (mis. banner judul) -> class gelap hilang -> latar terang sempat kedip.
    // Gelapkan lagi di microtask yang sama, sebelum browser menggambar.
    onReady(() => {
      new MutationObserver((muts) => {
        if (!state.dark) return;
        for (const m of muts) {
          const t = m.target;
          if (!(t instanceof HTMLElement) || t === root || t === document.body) continue;
          if (m.attributeName === 'class' && t.classList.contains('hmt-dk') && t.dataset.hmtBg === undefined) continue;
          if (t.classList.contains('hmt-dk') || SKIP_DARK.has(t.tagName)) continue;
          if (t.closest('#hmt-overlay, #hmt-dl, #hmt-preview, .hm-thumbs, .hm-grid-wrap, .gallery-content')) continue;
          const bg = lightBg(t);
          if (bg) { t.dataset.hmtBg = bg; t.classList.add('hmt-dk'); }
        }
      }).observe(document.body, { attributes: true, attributeFilter: ['class', 'style'], subtree: true });
    });
    window.addEventListener('load', () => { trimChrome(true); darkenTree(document.body); setTimeout(rescanDark, 1000); }, { once: true });
  }


  /* ====================================================================
   * INTRO KARTU (animasi muncul satu per satu dari kiri-atas)
   * Cara kerja:
   *  1) kartu langsung disembunyikan (class hmt-pre) supaya tidak sempat tampil dulu
   *  2) tunggu sampai daftar kartu stabil + gambar di layar termuat
   *  3) tiap kartu yang terlihat diputar animasinya dengan jeda bertingkat (urut DOM = kiri -> kanan, atas -> bawah)
   * Pakai Web Animations API, jadi tidak tergantung class/CSS lain.
   * ==================================================================== */
  const introInView = (c) => { const r = c.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0; };
  // kelompokkan nilai posisi yang berdekatan jadi nomor baris/kolom (0, 1, 2, ...)
  function introCluster(vals) {
    const uniq = [...new Set(vals.map((v) => Math.round(v)))].sort((a, b) => a - b);
    const idx = new Map(); let g = -1, last = -1e9;
    uniq.forEach((v) => { if (v - last > 8) g++; idx.set(v, g); last = v; });
    return vals.map((v) => idx.get(Math.round(v)));
  }
  // putar animasi pada kartu yang terlihat; mengembalikan total durasi (ms)
  function introPlay(cards, offset) {
    cards.forEach((c) => { try { c.getAnimations().forEach((a) => a.cancel()); } catch (e) { /* abaikan */ } });
    const vis = cards.filter(introInView);
    if (!vis.length) return 0;
    const step = Math.max(0, +state.introStep || 0);
    const order = state.introOrder;
    let raw;
    if (order === 'diag') {
      const rects = vis.map((c) => c.getBoundingClientRect());
      const rows = introCluster(rects.map((r) => r.top)), cols = introCluster(rects.map((r) => r.left));
      raw = vis.map((_, k) => (rows[k] + cols[k]) * step * 1.4);
    } else if (order === 'rand') {
      const perm = vis.map((_, k) => k).sort(() => Math.random() - .5);
      raw = perm.map((rank) => rank * step);
    } else raw = vis.map((_, k) => k * step);
    const mx = Math.max(0, ...raw), sc = mx > INTRO.maxStagger ? INTRO.maxStagger / mx : 1;
    const keys = Object.keys(INTRO_FX);
    const dur0 = INTRO.dur * (+state.introSpeed || 1);
    let total = 0;
    vis.forEach((c, k) => {
      const fx = INTRO_FX[state.introStyle === 'mix' ? keys[Math.floor(Math.random() * keys.length)] : state.introStyle] || INTRO_FX.rise;
      const dur = dur0 * (fx.d || 1), delay = Math.round(raw[k] * sc) + (offset || 0);
      total = Math.max(total, delay + dur);
      try { c.animate(fx.kf, { duration: dur, delay, easing: fx.ease, fill: 'backwards' }); } catch (e) { /* browser lama: kartu tampil biasa */ }
    });
    return total;
  }
  // animasi header: navbar dulu, banner menyusul; mengembalikan { total, offset } (offset = kapan kartu mulai)
  function introHeaders() {
    const nav = document.querySelector('.navbar');
    const bn = isGallery ? null : (document.querySelector('.hmt-banner:not(.navbar)') || document.querySelector('.list-title'));
    const dur0 = 650 * (+state.introSpeed || 1);
    let total = 0, any = false;
    const items = (el) => {
      const out = [];
      [...el.children].forEach((ch) => {
        const t = ch.tagName;
        if (t === 'SCRIPT' || t === 'STYLE' || t === 'NOSCRIPT') return;
        if (t === 'NAV') { const li = ch.querySelectorAll('li'); out.push(...(li.length ? li : ch.children)); } else out.push(ch);
      });
      return out;
    };
    const run = (el, key, base) => {
      const fx = HEAD_FX[key];
      if (!el || !fx || key === 'none') return;
      try { el.getAnimations({ subtree: true }).forEach((a) => a.cancel()); } catch (e) { /* abaikan */ }
      any = true;
      try {
        if (key === 'items') {
          const list = items(el);
          if (!list.length) { el.animate(HEAD_FX.fade.kf, { duration: dur0, delay: base, easing: 'ease-out', fill: 'backwards' }); total = Math.max(total, base + dur0); return; }
          const dur = dur0 * .9;
          list.forEach((it, k) => {
            const delay = base + k * 70;
            it.animate([{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: dur, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
            total = Math.max(total, delay + dur);
          });
        } else {
          const dur = dur0 * (fx.d || 1);
          el.animate(fx.kf, { duration: dur, delay: base, easing: fx.ease, fill: 'backwards' });
          total = Math.max(total, base + dur);
        }
      } catch (e) { /* browser lama: header tampil biasa */ }
    };
    run(nav, state.introNav, 0);
    const navOn = !!state.introNav && state.introNav !== 'none';
    run(bn, state.introBanner, navOn ? 160 : 0);
    // halaman galeri: cover + judul/info muncul berurutan setelah navbar
    let nBlk = 0;
    const bfx = isGallery ? INTRO_FX[state.introBlock] : null;
    if (bfx) {
      const big = '.hm-thumbs, .hm-grid-wrap';
      const picks = [];
      ['.cover-column', '.dj-gallery', '#gallery-brand', '.gallery-info'].forEach((sel) => document.querySelectorAll(sel).forEach((el) => {
        if (!picks.includes(el) && !el.querySelector(big)) picks.push(el); // wadah yang memuat thumbnail/kartu dilewati
      }));
      const tops = picks.filter((el) => !picks.some((o) => o !== el && o.contains(el)))
        .sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1));
      tops.forEach((el, k) => {
        try {
          el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
          const dur = 650 * (+state.introSpeed || 1) * (bfx.d || 1), delay = (navOn ? 140 : 0) + k * 120;
          el.animate(bfx.kf, { duration: dur, delay, easing: bfx.ease, fill: 'backwards' });
          total = Math.max(total, delay + dur); any = true; nBlk++;
        } catch (e) { /* abaikan */ }
      });
    }
    return { total, offset: any ? (nBlk ? 140 + nBlk * 120 + 160 : 300) : 0 };
  }
  // jalankan semua: header dulu, lalu kartu satu per satu; mengembalikan total durasi (ms)
  function introRun(cards) {
    const h = introHeaders();
    const t = introPlay(cards, h.offset);
    return Math.max(h.total, t);
  }
  const ITEM_SEL = '.hm-card, .hm-th'; // kartu daftar/related + thumbnail galeri
  const itemSig = () => {
    const it = document.querySelectorAll(ITEM_SEL), n = it.length;
    return n + ':' + (n ? it[0].getAttribute('href') + '|' + it[n - 1].getAttribute('href') : '');
  };
  // pratinjau dari panel pengaturan: putar ulang + latar panel dibuat transparan sebentar supaya kartu terlihat
  let introPvT = 0, introPvR = 0;
  function introPreview() {
    if (isReader || !state.introOn) return;
    clearTimeout(introPvT);
    introPvT = setTimeout(() => {
      const total = introRun([...document.querySelectorAll(ITEM_SEL)]);
      if (!overlay || !total) return;
      overlay.classList.add('hmt-pv');
      clearTimeout(introPvR);
      introPvR = setTimeout(() => overlay.classList.remove('hmt-pv'), total + 400);
    }, 300);
  }

  /* mode 'load': sembunyikan sejak awal, putar setelah daftar stabil.
   * mode 'nav' : dipasang saat tombol Back/Forward (popstate); hanya bereaksi kalau situs merender ulang daftarnya. */
  function introWatch(mode) {
    const nav = mode === 'nav';
    let t0 = Date.now(), finished = false, hidden = false, timer = 0, guard = 0, hdr = null, hdrAt = 0, sig = nav ? itemSig() : '';
    const BLK = ['hmt-pre-nav', 'hmt-pre-navi', 'hmt-pre-bn', 'hmt-pre-bni', 'hmt-pre-blk'];
    const dropBlk = () => BLK.forEach((c) => root.classList.remove(c));
    const release = () => { finished = true; mo.disconnect(); clearTimeout(timer); clearTimeout(guard); root.classList.remove('hmt-pre'); dropBlk(); srQueue(); };
    const hide = () => { if (hidden) return; hidden = true; root.classList.add('hmt-pre'); clearTimeout(guard); guard = setTimeout(() => { if (!finished) release(); }, INTRO.maxWait + 1500); };
    const runHdr = () => { if (hdr || nav) return; hdr = introHeaders(); hdrAt = Date.now(); dropBlk(); }; // header + blok galeri
    const imgsReady = (els) => els.every((c) => { const im = c.querySelector('img'); return !im || im.complete; });
    const check = () => {
      if (finished) return;
      const elapsed = Date.now() - t0, timeout = elapsed > INTRO.maxWait;
      const stkOk = stkReady || !state.stickyNav;
      const items = [...document.querySelectorAll(ITEM_SEL)];
      if (isGallery && !nav && !hdr && stkOk && elapsed > 500) runHdr(); // cover & info tidak menunggu thumbnail
      // halaman galeri: tunggu thumbnail besar terbentuk dulu (kartu related bisa muncul lebih awal)
      if (isGallery && !nav && state.thumbs && !timeout && !document.querySelector('.hm-th')) { timer = setTimeout(check, 150); return; }
      if (!items.length) { if (timeout) { runHdr(); release(); } else timer = setTimeout(check, 150); return; }
      if (!timeout && !(imgsReady(items.filter(introInView)) && stkOk)) { timer = setTimeout(check, 100); return; }
      runHdr();
      introPlay(items, hdr ? Math.max(0, hdr.offset - (Date.now() - hdrAt)) : 0);
      release(); // animasi sudah terdaftar (fill backwards menahan opacity 0 selama jeda), aman membuka sembunyi
    };
    const mo = new MutationObserver(() => {
      if (finished) return;
      const s2 = itemSig();
      if (s2 === sig) return;
      sig = s2;
      if (nav && !hidden) { hide(); t0 = Date.now(); } // daftar diganti situs -> sembunyikan seketika (sebelum paint)
      clearTimeout(timer); timer = setTimeout(check, INTRO.settle); // daftar berubah -> tunggu stabil lagi
    });
    mo.observe(root, { childList: true, subtree: true });
    if (nav) { guard = setTimeout(() => { if (!hidden) release(); }, 2500); return; } // tidak ada perubahan daftar -> tidak melakukan apa-apa
    hide();
    if (state.introNav && state.introNav !== 'none') root.classList.add(state.introNav === 'items' ? 'hmt-pre-navi' : 'hmt-pre-nav');
    if (!isGallery && state.introBanner && state.introBanner !== 'none') root.classList.add(state.introBanner === 'items' ? 'hmt-pre-bni' : 'hmt-pre-bn');
    if (isGallery && INTRO_FX[state.introBlock]) root.classList.add('hmt-pre-blk');
    timer = setTimeout(check, INTRO.settle);
  }
  /* ====================================================================
   * ANIMASI SAAT DI-SCROLL: kartu/thumbnail di bawah layar disembunyikan (data-hmt-sr),
   * lalu dianimasikan sekali ketika masuk layar. Yang sudah terlihat saat halaman dibuka tidak disentuh.
   * ==================================================================== */
  let srSeen = new WeakSet(), srIO = null, srRaf = 0;
  const srClear = () => document.querySelectorAll('[data-hmt-sr]').forEach((e) => e.removeAttribute('data-hmt-sr'));
  function srReveal(entries) {
    const hit = entries.filter((e) => e.isIntersecting)
      .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left));
    if (!hit.length) return;
    const step = Math.min(+state.introStep || 0, 90), keys = Object.keys(INTRO_FX);
    const st = state.introScrollStyle === 'same' ? state.introStyle : state.introScrollStyle;
    hit.forEach((en, k) => {
      const el = en.target;
      if (srIO) srIO.unobserve(el);
      const fx = INTRO_FX[st === 'mix' ? keys[Math.floor(Math.random() * keys.length)] : st] || INTRO_FX.rise;
      try { el.animate(fx.kf, { duration: INTRO.dur * (+state.introSpeed || 1) * (fx.d || 1) * .85, delay: k * step, easing: fx.ease, fill: 'backwards' }); } catch (e) { /* tampil biasa */ }
      el.removeAttribute('data-hmt-sr'); // animasi sudah terdaftar (fill backwards menahan opacity 0), aman dibuka
    });
  }
  function srScan() {
    srRaf = 0;
    if (isReader || !state.introScroll || root.classList.contains('hmt-pre')) return; // intro awal masih jalan: dipanggil lagi saat selesai
    try {
      if (!srIO) srIO = new IntersectionObserver(srReveal, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
      document.querySelectorAll(ITEM_SEL).forEach((el) => {
        if (srSeen.has(el)) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return; // sedang tersembunyi: cek lagi nanti
        srSeen.add(el);
        if (r.top >= innerHeight * .94) { el.setAttribute('data-hmt-sr', ''); srIO.observe(el); } // di bawah layar
      });
    } catch (e) { srClear(); } // apa pun yang gagal: jangan biarkan kartu tersembunyi
  }
  function srQueue() { if (!srRaf) srRaf = requestAnimationFrame(srScan); }
  function srRefresh() {
    if (state.introScroll) { srQueue(); return; }
    if (srIO) { srIO.disconnect(); srIO = null; }
    srClear(); srSeen = new WeakSet();
  }
  if (!isReader) {
    new MutationObserver(srQueue).observe(root, { childList: true, subtree: true });
    window.addEventListener('scroll', srQueue, { passive: true });
    window.addEventListener('resize', srQueue);
    srQueue();
  }

  if (!isReader && state.introOn) introWatch('load');
  // tombol Back/Forward: halaman dipulihkan dari cache browser (bfcache) -> putar ulang animasinya
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted || isReader || !state.introOn) return;
    try { introRun([...document.querySelectorAll(ITEM_SEL)]); } catch (err) { /* abaikan */ }
  });
  // Back/Forward pada situs yang merender ulang daftar tanpa reload
  window.addEventListener('popstate', () => { if (!isReader && state.introOn) introWatch('nav'); });

  /* ====================================================================
   * READER: WEBTOON
   * ==================================================================== */
  if (isReader) {
    const waitFor = (cond, ms = 12000) => new Promise((res) => {
      const t0 = Date.now();
      (function tick() {
        if (cond()) return res(true);
        if (Date.now() - t0 > ms) return res(false);
        setTimeout(tick, 150);
      })();
    });

    function attach(img, f) {
      const list = candidates(f);
      let i = 0;
      img.addEventListener('error', () => {
        if (++i < list.length) {
          img.src = list[i];
        } else {
          img.classList.add('wt-fail');
          img.title = T('Gagal dimuat, klik untuk coba lagi');
          console.warn('[HMT] semua URL gagal untuk gambar', img.dataset.idx, list);
        }
      });
      img.addEventListener('click', () => {
        if (!img.classList.contains('wt-fail')) return;
        img.classList.remove('wt-fail');
        i = 0;
        img.removeAttribute('src');
        requestAnimationFrame(() => { img.src = list[0]; });
      });
      if (list.length) img.src = list[0];
      else img.classList.add('wt-fail');
    }

    let building = false;
    async function buildWebtoon() {
      if (building) return;
      building = true;
      try {
        const ok = await waitFor(() => document.body && window.galleryinfo && window.galleryinfo.files &&
          window.gg && typeof window.gg.m === 'function');
        if (!ok) {
          console.warn('[HMT] galleryinfo/gg tidak ditemukan, webtoon dibatalkan');
          wtFailed = true; apply(); // kembali ke reader asli
          return;
        }

        const files = window.galleryinfo.files;
        const old = document.getElementById('wt-container');
        if (old) old.remove();

        const wrap = mk('div');
        wrap.id = 'wt-container';

        files.forEach((f, i) => {
          const img = document.createElement('img');
          img.loading = 'lazy';
          img.decoding = 'async';
          img.alt = '';
          img.dataset.idx = i;
          if (f.width && f.height) {
            img.width = f.width; img.height = f.height;
            img.style.aspectRatio = `${f.width} / ${f.height}`;
          }
          attach(img, f);
          wrap.appendChild(img);
        });

        const anchor = document.getElementById('comicImages');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor);
        else document.body.appendChild(wrap);

        // counter halaman + sinkron dengan dropdown halaman
        let counter = document.getElementById('wt-counter');
        if (!counter) { counter = mk('div'); counter.id = 'wt-counter'; document.body.appendChild(counter); }
        const sel = document.getElementById('single-page-select');
        const imgs = [...wrap.children];
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const idx = +e.target.dataset.idx;
            counter.textContent = `${idx + 1} / ${imgs.length}`;
            if (sel && sel.options.length === imgs.length) sel.selectedIndex = idx;
          });
        }, { rootMargin: '-45% 0px -45% 0px' });
        imgs.forEach((im) => io.observe(im));
        counter.textContent = `1 / ${imgs.length}`;

        // dropdown halaman -> lompat ke gambar
        if (sel && !sel.dataset.hmt) {
          sel.dataset.hmt = '1';
          sel.addEventListener('change', (e) => {
            if (!window.__wtReady || !state.webtoon) return;
            e.stopImmediatePropagation();
            const target = imgs[sel.selectedIndex];
            if (target) target.scrollIntoView({ block: 'start' });
          }, true);
        }

        window.__wtReady = true;
        wtFailed = false;
        apply();
        const hm = location.hash.match(/^#(\d+)/);
        const target = hm && imgs[+hm[1] - 1];
        if (target) target.scrollIntoView({ block: 'start' });
        else window.scrollTo(0, 0);
      } finally {
        building = false;
      }
    }

    // Keyboard: j / panah kiri = gambar berikutnya, k / panah kanan = sebelumnya
    window.addEventListener('keydown', (e) => {
      if (!window.__wtReady || !state.webtoon) return;
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const k = e.key;
      if (!['ArrowLeft', 'ArrowRight', 'j', 'k', 'v', 'h'].includes(k)) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      const imgs = [...document.querySelectorAll('#wt-container img')];
      const mid = window.innerHeight / 2;
      let cur = imgs.findIndex((i) => i.getBoundingClientRect().bottom > mid);
      if (cur < 0) cur = imgs.length - 1;
      const next = (k === 'ArrowLeft' || k === 'j') ? cur + 1 : (k === 'ArrowRight' || k === 'k') ? cur - 1 : cur;
      if (imgs[next]) imgs[next].scrollIntoView({ block: 'start' });
    }, true);

    buildWebtoonFn = buildWebtoon;
    if (state.webtoon) buildWebtoon();
  }


  /* ====================================================================
   * PANEL PILIH UNDUHAN: klik "Download" -> pilih gambar dulu -> ZIP
   * (ZIP dibuat sendiri tanpa library; gambar webp/avif sudah terkompres
   * jadi disimpan apa adanya / "store")
   * ==================================================================== */
  const CRC_T = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function makeZip(entries) { // entries: [{ name, blob, size, crc }]
    const enc = new TextEncoder();
    const d = new Date();
    const dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
    const dd = (((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    const parts = [], central = [];
    let off = 0;
    for (const e of entries) {
      const nm = enc.encode(e.name);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, dt, true); lh.setUint16(12, dd, true);
      lh.setUint32(14, e.crc, true); lh.setUint32(18, e.size, true); lh.setUint32(22, e.size, true);
      lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, nm, e.blob);

      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, dt, true); ch.setUint16(14, dd, true);
      ch.setUint32(16, e.crc, true); ch.setUint32(20, e.size, true); ch.setUint32(24, e.size, true);
      ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      central.push(ch.buffer, nm);
      off += 30 + nm.length + e.size;
    }
    const cdSize = central.reduce((s, p) => s + p.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
  }

  // Konversi gambar (webp/avif) -> JPG lewat canvas. Latar putih untuk transparansi.
  // Mengembalikan { blob, w, h }.
  async function toJpg(buf, q) {
    const bmp = await createImageBitmap(new Blob([buf]));
    const w = bmp.width, h = bmp.height;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0);
    if (bmp.close) bmp.close();
    const blob = await new Promise((res, rej) => cv.toBlob((x) => (x ? res(x) : rej(new Error('toBlob gagal'))), 'image/jpeg', q / 100));
    cv.width = cv.height = 0;
    return { blob, w, h };
  }

  // PDF sederhana: satu gambar JPEG (DCTDecode) per halaman, ukuran halaman = ukuran gambar.
  function makePdf(pages) { // pages: [{ blob, size, w, h }]
    const enc = new TextEncoder();
    const parts = [];
    let off = 0;
    const push = (x) => { parts.push(x); off += x.byteLength !== undefined ? x.byteLength : x.size; };
    const str = (t) => push(enc.encode(t));
    const n = pages.length;
    const xref = new Array(3 * n + 3).fill(0);
    const obj = (id, fn) => { xref[id] = off; str(id + ' 0 obj\n'); fn(); str('endobj\n'); };

    str('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
    obj(1, () => str('<< /Type /Catalog /Pages 2 0 R >>\n'));
    obj(2, () => str('<< /Type /Pages /Count ' + n + ' /Kids [' + pages.map((_, i) => (5 + 3 * i) + ' 0 R').join(' ') + '] >>\n'));
    pages.forEach((pg, i) => {
      const img = 3 + 3 * i, con = 4 + 3 * i, page = 5 + 3 * i;
      const pw = Math.round(pg.w * 0.75 * 100) / 100, ph = Math.round(pg.h * 0.75 * 100) / 100;
      obj(img, () => {
        str('<< /Type /XObject /Subtype /Image /Width ' + pg.w + ' /Height ' + pg.h +
          ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + pg.size + ' >>\nstream\n');
        push(pg.blob);
        str('\nendstream\n');
      });
      const content = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q';
      obj(con, () => str('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream\n'));
      obj(page, () => str('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 ' + img +
        ' 0 R >> >> /Contents ' + con + ' 0 R >>\n'));
    });
    const xrefOff = off;
    let x = 'xref\n0 ' + (3 * n + 3) + '\n0000000000 65535 f \n';
    for (let id = 1; id < 3 * n + 3; id++) x += String(xref[id]).padStart(10, '0') + ' 00000 n \n';
    x += 'trailer\n<< /Size ' + (3 * n + 3) + ' /Root 1 0 R >>\nstartxref\n' + xrefOff + '\n%%EOF\n';
    str(x);
    return new Blob(parts, { type: 'application/pdf' });
  }

  /* ====================================================================
   * Notifikasi (toast) & dialog konfirmasi buatan sendiri
   * (pengganti alert/confirm bawaan browser)
   * ==================================================================== */
  let modalOpen = false;
  function toast(text, opt) {
    opt = opt || {};
    const type = opt.type || 'info';
    let host = document.getElementById('hmt-toasts');
    if (!host) { host = mk('div'); host.id = 'hmt-toasts'; }
    if (!host.isConnected) document.body.appendChild(host);
    const t = mk('div', 'hmt-toast ' + type);
    t.appendChild(mk('span', 't-ico', type === 'ok' ? '✓' : type === 'err' ? '✕' : 'ℹ'));
    t.appendChild(mk('span', 't-msg', T(text)));
    const kill = () => {
      if (!t.isConnected) return;
      t.classList.add('out');
      setTimeout(() => t.remove(), 200);
    };
    if (opt.action) {
      const b = mk('button', 'pri', T(opt.action.label)); b.type = 'button';
      b.addEventListener('click', () => { kill(); try { opt.action.fn(); } catch (e) { console.warn('[HMT]', e); } });
      t.appendChild(b);
    }
    const x = mk('button', 'x', '✕'); x.type = 'button'; x.addEventListener('click', kill);
    t.appendChild(x);
    host.appendChild(t);
    while (host.children.length > 4) host.firstChild.remove();
    const ms = opt.ms != null ? opt.ms : (opt.action ? 12000 : type === 'err' ? 8000 : 4500);
    if (ms > 0) setTimeout(kill, ms);
    return kill;
  }

  function askConfirm(o) {
    return new Promise((resolve) => {
      modalOpen = true;
      const ov = mk('div'); ov.id = 'hmt-modal';
      const box = mk('div', 'm-box');
      box.appendChild(mk('div', 'm-title', T(o.title || 'Konfirmasi')));
      if (o.text) box.appendChild(mk('div', 'm-text', T(o.text)));
      const act = mk('div', 'm-act');
      const bNo = mk('button', '', T(o.cancel || 'Batal')); bNo.type = 'button';
      const bOk = mk('button', o.danger ? 'danger' : 'pri', T(o.ok || 'OK')); bOk.type = 'button';
      act.append(bNo, bOk); box.appendChild(act); ov.appendChild(box);
      const done = (v) => {
        window.removeEventListener('keydown', onKey, true);
        ov.remove(); setTimeout(() => { modalOpen = false; }, 0); resolve(v);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); done(false); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); done(true); }
      };
      window.addEventListener('keydown', onKey, true);
      bNo.addEventListener('click', () => done(false));
      bOk.addEventListener('click', () => done(true));
      ov.addEventListener('mousedown', (e) => { if (e.target === ov) done(false); });
      document.body.appendChild(ov);
      bOk.focus && setTimeout(() => { try { bOk.focus(); } catch (e) { /* abaikan */ } }, 0);
    });
  }

  /* ====================================================================
   * Jendela: geser (drag) & ubah ukuran (resize), posisi diingat
   * ==================================================================== */
  function fixPos(box) {
    const b = box.getBoundingClientRect();
    box.style.left = b.left + 'px'; box.style.top = b.top + 'px';
    box.style.right = 'auto'; box.style.bottom = 'auto';
    return b;
  }
  function keepInView(box) {
    const b = box.getBoundingClientRect();
    if (!b.width) return;
    const x = Math.min(Math.max(b.left, 80 - b.width), innerWidth - 80);
    const y = Math.min(Math.max(b.top, 0), innerHeight - 40);
    if (x !== b.left || y !== b.top) {
      box.style.left = x + 'px'; box.style.top = y + 'px'; box.style.right = 'auto'; box.style.bottom = 'auto';
    }
  }
  function saveRect(box, key) {
    const b = box.getBoundingClientRect();
    set(key, { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) });
  }
  function attachDrag(box, handle, key) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button, input')) return;
      e.preventDefault();
      const b = fixPos(box);
      const sx = e.clientX, sy = e.clientY, ox = b.left, oy = b.top, w = b.width;
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
      const mv = (ev) => {
        box.style.left = Math.min(Math.max(ox + ev.clientX - sx, 80 - w), innerWidth - 80) + 'px';
        box.style.top = Math.min(Math.max(oy + ev.clientY - sy, 0), innerHeight - 40) + 'px';
      };
      const up = () => {
        handle.removeEventListener('pointermove', mv);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        saveRect(box, key);
      };
      handle.addEventListener('pointermove', mv);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }
  function attachResize(box, key, minW, minH) {
    ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach((d) => {
      const h = mk('div', 'dl-rs dl-rs-' + d);
      box.appendChild(h);
      h.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        const b = fixPos(box);
        const sx = e.clientX, sy = e.clientY;
        try { h.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
        const mv = (ev) => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          let w = b.width, hh = b.height, x = b.left, y = b.top;
          if (d.includes('e')) w = b.width + dx;
          if (d.includes('w')) w = b.width - dx;
          if (d.includes('s')) hh = b.height + dy;
          if (d.includes('n')) hh = b.height - dy;
          w = Math.min(Math.max(w, minW), innerWidth);
          hh = Math.min(Math.max(hh, minH), innerHeight);
          if (d.includes('w')) x = b.left + b.width - w;
          if (d.includes('n')) {
            y = b.top + b.height - hh;
            if (y < 0) { hh += y; y = 0; }
          }
          box.style.left = x + 'px'; box.style.top = y + 'px';
          box.style.width = w + 'px'; box.style.height = hh + 'px';
        };
        const up = () => {
          h.removeEventListener('pointermove', mv);
          h.removeEventListener('pointerup', up);
          h.removeEventListener('pointercancel', up);
          saveRect(box, key);
        };
        h.addEventListener('pointermove', mv);
        h.addEventListener('pointerup', up);
        h.addEventListener('pointercancel', up);
      });
    });
  }

  /* ====================================================================
   * Simpan ke folder (File System Access API, Chrome/Edge) + penyimpanan
   * antrian di IndexedDB (dibagi antar tab & antar halaman hitomi.la)
   * ==================================================================== */
  const HAS_DIR = typeof window.showDirectoryPicker === 'function';
  let dirHandle = null; // folder tujuan terakhir (disimpan di IndexedDB supaya tidak perlu dipilih ulang)
  let dbp = null;
  const idbOpen = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('hmt', 2);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('h')) db.createObjectStore('h');
      if (!db.objectStoreNames.contains('jobs')) db.createObjectStore('jobs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('data')) db.createObjectStore('data');
    };
    r.onsuccess = () => {
      const db = r.result;
      db.onversionchange = () => { db.close(); dbp = null; };
      res(db);
    };
    r.onerror = () => { dbp = null; rej(r.error); };
  }));
  async function idb(store, mode, fn) {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      let out;
      const r = fn(t.objectStore(store));
      if (r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  }
  const idbGet = (k) => idb('h', 'readonly', (s) => s.get(k));
  const idbSet = (k, v) => idb('h', 'readwrite', (s) => s.put(v, k));

  const jobPut = (j) => idb('jobs', 'readwrite', (s) => s.put(j));
  const jobGet = (id) => idb('jobs', 'readonly', (s) => s.get(id));
  const jobAll = () => idb('jobs', 'readonly', (s) => s.getAll());
  const jobDel = (id) => idb('jobs', 'readwrite', (s) => s.delete(id));
  const dKey = (id, k) => id + ':' + k;
  const dataPut = (id, k, v) => idb('data', 'readwrite', (s) => s.put(v, dKey(id, k)));
  const dataGet = (id, k) => idb('data', 'readonly', (s) => s.get(dKey(id, k)));
  const dataKeys = (id) => idb('data', 'readonly', (s) => s.getAllKeys(IDBKeyRange.bound(id + ':', id + ';')));
  const dataClear = (id) => idb('data', 'readwrite', (s) => s.delete(IDBKeyRange.bound(id + ':', id + ';')));

  // Ubah satu job secara atomik. onlyIfRunning: tidak menulis kalau job sudah dibatalkan/dihapus.
  async function jobPatch(id, patch, onlyIfRunning) {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const t = db.transaction('jobs', 'readwrite');
      const s = t.objectStore('jobs');
      let result = null;
      const g = s.get(id);
      g.onsuccess = () => {
        const cur = g.result;
        if (!cur) return;
        if (onlyIfRunning && cur.status !== 'running') { result = cur; return; }
        const nx = Object.assign(cur, typeof patch === 'function' ? patch(cur) : patch);
        s.put(nx); result = nx;
      };
      t.oncomplete = () => res(result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  }

  // Chrome menolak folder sistem (Downloads/Documents/Desktop langsung, drive root, dll) dengan dialog bawaan
  // yang tidak bisa diganti. Jadi sebelum picker dibuka, kita beri panduan dengan dialog buatan sendiri.
  async function pickDir(why) {
    const ok = await askConfirm({
      title: 'Pilih folder tujuan',
      text: (why ? T(why) + ' ' : '') + T('Pilih atau buat SUBFOLDER sendiri (mis. Documents\\Hitomi). Browser menolak folder sistem seperti Downloads, Documents, atau Desktop langsung.'),
      ok: 'Pilih folder', cancel: 'Batal',
    });
    if (!ok) { const e = new Error('dibatalkan'); e.name = 'AbortError'; throw e; }
    const h = await window.showDirectoryPicker({ id: 'hmt-dl', mode: 'readwrite' });
    dirHandle = h;
    try { await idbSet('dir', h); } catch (e) { /* tidak fatal */ }
    return h;
  }
  async function ensureDir() { // panggil langsung dari klik pengguna (perlu user gesture)
    if (!dirHandle) { try { dirHandle = await idbGet('dir'); } catch (e) { /* abaikan */ } }
    if (dirHandle) {
      try {
        let perm = await dirHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') perm = await dirHandle.requestPermission({ mode: 'readwrite' });
        if (perm === 'granted') return dirHandle;
      } catch (e) { /* handle lama tidak valid -> pilih ulang */ }
    }
    return pickDir(dirHandle ? 'Izin ke folder sebelumnya tidak tersedia.' : 'Belum ada folder tujuan.');
  }
  async function dirIfGranted() { // tanpa gesture: hanya kalau izin sudah ada
    if (!dirHandle) { try { dirHandle = await idbGet('dir'); } catch (e) { /* abaikan */ } }
    if (!dirHandle) return null;
    try { if ((await dirHandle.queryPermission({ mode: 'readwrite' })) === 'granted') return dirHandle; } catch (e) { /* abaikan */ }
    return null;
  }
  async function writeTo(dir, name, blob) {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    try { await w.write(blob); } finally { await w.close(); }
  }

  async function fetchUrls(urls) {
    let last = null;
    for (const u of urls) {
      try {
        const r = await fetch(u, { credentials: 'omit', signal: window.AbortSignal && AbortSignal.timeout ? AbortSignal.timeout(60000) : undefined });
        if (r.ok) return { buf: await r.arrayBuffer(), url: u };
        last = new Error('HTTP ' + r.status);
      } catch (e) { last = e; }
    }
    throw last || new Error('tidak ada URL');
  }

  /* ====================================================================
   * ANTRIAN UNDUHAN: berjalan di latar belakang, dilanjutkan otomatis
   * di halaman/tab mana pun. Satu "runner" aktif (Web Locks). Kalau halaman
   * yang menjalankannya ditinggalkan, halaman berikutnya meneruskan dari
   * gambar yang belum selesai (gambar yang sudah jadi tersimpan di IndexedDB).
   * ==================================================================== */
  let leaving = false;
  window.addEventListener('beforeunload', () => { leaving = true; setTimeout(() => { leaving = false; }, 2500); });
  window.addEventListener('pagehide', () => { leaving = true; });
  window.addEventListener('pageshow', () => { leaving = false; });

  const isActive = (j) => j.status === 'queued' || j.status === 'running';
  let runnerOn = false;

  async function runJob(j) {
    await jobPatch(j.id, { status: 'running' });
    const have = new Set((await dataKeys(j.id)).map((k) => +String(k).split(':')[1]));
    const failedSet = new Set(j.failed || []);
    const pending = [];
    j.items.forEach((it, k) => { if (!have.has(k) && !failedSet.has(k)) pending.push(k); });
    await jobPatch(j.id, { done: have.size + failedSet.size });

    let next = 0, alive = true;
    const worker = async () => {
      while (alive && !leaving && next < pending.length) {
        const k = pending[next++], it = j.items[k];
        try {
          const { buf, url } = await fetchUrls(it.urls);
          let ext = (url.match(/\.(\w+)(?:\?|$)/) || [])[1] || 'webp';
          let rec, kept = false;
          if (j.out === 'pdf') {
            const r = await toJpg(buf, j.q);
            rec = { blob: r.blob, size: r.blob.size, w: r.w, h: r.h };
          } else {
            let data = buf;
            if (j.asJpg && !/^jpe?g$/i.test(ext)) {
              try { data = await (await toJpg(buf, j.q)).blob.arrayBuffer(); ext = 'jpg'; }
              catch (e) { kept = true; console.warn('[HMT] konversi JPG gagal, pakai file asli: hal.', it.i + 1, e); }
            }
            rec = { name: String(it.i + 1).padStart(j.pad, '0') + '.' + ext, blob: new Blob([data]), size: data.byteLength, crc: crc32(new Uint8Array(data)) };
          }
          await dataPut(j.id, k, rec);
          const cur = await jobPatch(j.id, (c) => ({ done: c.done + 1, kept: (c.kept || 0) + (kept ? 1 : 0) }), true);
          if (!cur || cur.status !== 'running') alive = false;
        } catch (e) {
          if (leaving) return; // halaman ditinggalkan: jangan dianggap gagal, halaman berikut melanjutkan
          console.warn('[HMT] gagal memproses gambar', it.i + 1, e);
          const cur = await jobPatch(j.id, (c) => ({ done: c.done + 1, failed: (c.failed || []).concat(k) }), true);
          if (!cur || cur.status !== 'running') alive = false;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, Math.max(1, pending.length)) }, worker));
    if (leaving) return;

    const cur = await jobGet(j.id);
    if (!cur || cur.status !== 'running') { // dibatalkan / dihapus
      await dataClear(j.id);
      if (cur && cur.status === 'canceled') await jobDel(j.id);
      return;
    }
    await finalizeJob(j.id, null);
  }

  // Susun ZIP/PDF/gambar dari data di IndexedDB. gestureDir = folder dari klik pengguna (opsional).
  async function finalizeJob(id, gestureDir) {
    try {
      const j = await jobGet(id);
      if (!j) return;
      const keys = (await dataKeys(id)).map((k) => +String(k).split(':')[1]).sort((a, b) => a - b);
      if (!keys.length) { await jobPatch(id, { status: 'error', ended: Date.now(), err: 'Semua gambar gagal diproses (lihat console F12)' }); return; }
      let dir = null;
      if (HAS_DIR && (j.dest === 'dir' || j.out === 'img')) {
        dir = gestureDir || await dirIfGranted();
        if (!dir) { await jobPatch(id, { status: 'ready' }); return; } // menunggu klik "Simpan" (butuh izin folder)
      }
      const recs = [];
      for (const k of keys) recs.push(await dataGet(id, k));
      if (j.out === 'img') {
        const sub = await dir.getDirectoryHandle(j.subName, { create: true });
        for (const r of recs) await writeTo(sub, r.name, r.blob);
      } else {
        const blob = j.out === 'pdf' ? makePdf(recs) : makeZip(recs);
        if (dir) await writeTo(dir, j.fname, blob);
        else {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = j.fname;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 120000);
        }
      }
      await dataClear(id);
      await jobPatch(id, { status: 'done', ended: Date.now(), dirName: dir ? dir.name : '' });
      markDone(j.gid);
    } catch (e) {
      console.warn('[HMT] finalisasi gagal', e);
      await jobPatch(id, { status: 'error', ended: Date.now(), err: 'Gagal menyimpan: ' + ((e && e.message) || e) });
    }
  }

  async function runLoop() {
    for (;;) {
      if (leaving) return;
      const jobs = (await jobAll()).sort((a, b) => a.created - b.created);
      const j = jobs.find((x) => x.status === 'running') || jobs.find((x) => x.status === 'queued');
      if (!j) return;
      try { await runJob(j); }
      catch (e) {
        console.warn('[HMT] job error', e);
        await jobPatch(j.id, { status: 'error', ended: Date.now(), err: 'Error: ' + ((e && e.message) || e) });
      }
    }
  }

  function kick() {
    if (runnerOn) return;
    const go = async () => { runnerOn = true; try { await runLoop(); } finally { runnerOn = false; } };
    if (navigator.locks && navigator.locks.request) {
      navigator.locks.request('hmt-dl-runner', { ifAvailable: true }, async (lock) => { if (lock) await go(); }).catch(() => {});
    } else go();
  }

  async function cancelJob(id) {
    await jobPatch(id, { status: 'canceled' });
    await dataClear(id);
    setTimeout(() => { jobDel(id).catch(() => {}); }, 1500);
    dmTick();
  }
  async function removeJob(id) {
    await dataClear(id); await jobDel(id); dmTick();
  }
  async function saveReady(id) { // dipanggil dari klik (gesture) -> minta izin folder
    try {
      const dir = await ensureDir();
      await finalizeJob(id, dir);
      dmTick();
    } catch (e) {
      if (e && e.name === 'AbortError') toast('Pemilihan folder dibatalkan');
      else toast(T('Tidak bisa mengakses folder: {0}', (e && e.message) || e), { type: 'err' });
    }
  }

  /* ====================================================================
   * Widget antrian (kanan bawah, bisa digeser/ciut) + notifikasi status
   * ==================================================================== */
  let dmEl = null, dmBody = null, dmTitle = null, dmPlaced = false, dmFirst = true;
  const dmRows = new Map();
  const dmSeen = new Map();

  function jobText(j) {
    const n = j.items.length;
    const nf = j.failed && j.failed.length ? T(' (gagal: {0})', j.failed.length) : '';
    switch (j.status) {
      case 'queued': return T('Menunggu antrian · {0} gambar', n);
      case 'running':
        return j.done >= n ? T('Menyusun file…')
          : T('Mengunduh {0} / {1}', j.done, n) + nf + (j.out === 'pdf' || j.asJpg ? T(' · konversi JPG') : '');
      case 'ready': return T('Siap — klik Simpan untuk menulis ke folder') + nf;
      case 'done': return T('Selesai ✓ → {0}', outName(j.out)) + (j.dirName ? T(' di folder "{0}"', j.dirName) : '') + nf;
      case 'error': return tErr(j.err || 'Gagal');
      default: return j.status;
    }
  }

  function ensureDm() {
    if (dmEl) { if (!dmEl.isConnected) document.body.appendChild(dmEl); return dmEl; }
    dmEl = mk('div', 'hide'); dmEl.id = 'hmt-dm';
    const head = mk('div', 'dm-head');
    dmTitle = mk('span', '', T('Unduhan'));
    const hb = mk('div', 'dm-hb');
    const bClr = mk('button', '', T('Bersihkan')); bClr.type = 'button'; bClr.title = T('Hapus yang sudah selesai / gagal');
    const bMin = mk('button', '', '—'); bMin.type = 'button'; bMin.title = T('Ciutkan / buka');
    bClr.addEventListener('click', async () => {
      const js = await jobAll();
      for (const j of js) if (j.status === 'done' || j.status === 'error') await removeJob(j.id);
    });
    const applyMin = () => dmEl.classList.toggle('min', !!get('dmMin', false));
    bMin.addEventListener('click', () => { set('dmMin', !get('dmMin', false)); applyMin(); });
    hb.append(bClr, bMin);
    head.append(dmTitle, hb);
    dmBody = mk('div', 'dm-body');
    dmEl.append(head, dmBody);
    applyMin();
    document.body.appendChild(dmEl);
    attachDrag(dmEl, head, 'dmRect');
    window.addEventListener('resize', () => keepInView(dmEl));
    return dmEl;
  }

  function buildRow(j) {
    const el = mk('div', 'dm-job');
    const t = mk('div', 'dm-t', j.title); t.title = j.title;
    const s = mk('div', 'dm-s');
    const track = mk('div', 'dm-track'); const fill = mk('div', 'dm-fill'); track.appendChild(fill);
    const a = mk('div', 'dm-a');
    el.append(t, s, track, a);
    return { el, s, fill, a, status: null };
  }

  function setActions(row, j) {
    row.a.textContent = '';
    const btn = (label, cls, fn) => { const b = mk('button', cls || '', T(label)); b.type = 'button'; b.addEventListener('click', fn); row.a.appendChild(b); return b; };
    if (isActive(j)) {
      btn('Batal', '', async () => {
        const ok = await askConfirm({ title: 'Batalkan unduhan?', text: j.title, ok: 'Batalkan', cancel: 'Lanjutkan', danger: true });
        if (ok) cancelJob(j.id);
      });
    } else if (j.status === 'ready') {
      btn('Simpan', 'pri', () => saveReady(j.id));
      btn('Hapus', '', () => removeJob(j.id));
    } else {
      btn('Hapus', '', () => removeJob(j.id));
    }
  }

  function renderDm(jobs) {
    const vis = jobs.filter((j) => j.status !== 'canceled');
    if (!vis.length && !dmEl) return;
    ensureDm();
    dmEl.classList.toggle('hide', !vis.length);
    if (vis.length && !dmPlaced) {
      dmPlaced = true;
      const r = get('dmRect', null);
      if (r && typeof r.x === 'number') {
        dmEl.style.left = r.x + 'px'; dmEl.style.top = r.y + 'px'; dmEl.style.right = 'auto'; dmEl.style.bottom = 'auto';
      }
      keepInView(dmEl);
    }
    const act = vis.filter(isActive).length;
    dmTitle.textContent = T('Unduhan') + (act ? ' · ' + T('{0} berjalan', act) : '');
    for (const [id, row] of dmRows) if (!vis.some((j) => j.id === id)) { row.el.remove(); dmRows.delete(id); }
    vis.forEach((j) => {
      let row = dmRows.get(j.id);
      if (!row) { row = buildRow(j); dmRows.set(j.id, row); dmBody.appendChild(row.el); }
      if (row.status !== j.status) { row.status = j.status; row.el.className = 'dm-job ' + j.status; setActions(row, j); }
      row.s.textContent = jobText(j);
      const n = j.items.length || 1;
      row.fill.style.width = (j.status === 'done' || j.status === 'ready' ? 100 : Math.round(Math.min(j.done, n) / n * 100)) + '%';
    });
  }

  function notifyChanges(jobs) {
    jobs.forEach((j) => {
      const prev = dmSeen.get(j.id);
      dmSeen.set(j.id, j.status);
      if (j.status === 'done' && prev !== j.status) markCards();
      if (dmFirst || prev === j.status || document.visibilityState !== 'visible') return;
      if (j.status === 'done') toast(T('Selesai: {0} → {1}', j.title, outName(j.out)), { type: 'ok' });
      else if (j.status === 'ready') toast(T('Unduhan selesai, tinggal disimpan ke folder: {0}', j.title), { action: { label: 'Simpan', fn: () => saveReady(j.id) } });
      else if (j.status === 'error') toast(j.title + ' — ' + tErr(j.err || 'gagal'), { type: 'err' });
    });
  }

  let ticking = false;
  async function dmTick() {
    if (ticking) return;
    ticking = true;
    try {
      const jobs = (await jobAll()).sort((a, b) => a.created - b.created);
      for (const j of jobs) { // bersihkan yang sudah selesai > 60 detik
        if (j.status === 'done' && Date.now() - (j.ended || 0) > 60000) { await removeJob(j.id); }
      }
      const live = jobs.filter((j) => !(j.status === 'done' && Date.now() - (j.ended || 0) > 60000));
      renderDm(live);
      notifyChanges(live);
      dmFirst = false;
      if (live.some(isActive) && !runnerOn) kick();
    } catch (e) { /* IndexedDB tidak tersedia: abaikan */ }
    ticking = false;
  }
  function dmStart() { dmTick(); setInterval(dmTick, 1200); }

  /* ====================================================================
   * Panel pilih gambar (bisa digeser & di-resize). Tombol Unduh hanya
   * memasukkan pekerjaan ke antrian; panel langsung ditutup.
   * ==================================================================== */
  let dlEl = null, dlCleanup = null;
  function closeDl() {
    if (dlCleanup) { dlCleanup(); dlCleanup = null; }
    if (dlEl) { dlEl.remove(); dlEl = null; }
  }

  function openDownloadPanel() {
    if (dlEl) return;
    const info = window.galleryinfo;
    const files = info.files;
    const total = files.length;
    const sel = new Set(files.map((_, i) => i));
    const rawTitle = String(info.title || document.title || 'hitomi').replace(/\s+/g, ' ').trim();
    const safeTitle = rawTitle.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'hitomi';
    const subName = safeTitle + (info.id ? ' [' + info.id + ']' : '');
    const zipName = subName + '.zip';

    const doneAt = info.id ? doneMap()[String(info.id)] : 0;
    if (state.dlMark && doneAt) {
      toast(T('Galeri ini sudah pernah diunduh ({0}).', new Date(doneAt).toLocaleDateString(state.lang === 'en' ? 'en-US' : 'id-ID')),
        { action: { label: 'Hapus tanda', fn: () => unmarkDone(String(info.id)) } });
    }

    dlEl = mk('div'); dlEl.id = 'hmt-dl';
    const box = mk('div', 'dl-box');
    box.style.setProperty('--dl-th', state.dlThumb + 'px');
    dlEl.appendChild(box);

    const head = mk('div', 'dl-head');
    const hl = mk('div'); hl.style.minWidth = '0';
    hl.appendChild(mk('div', 'dl-title', T('Pilih gambar untuk diunduh')));
    hl.appendChild(mk('div', 'dl-sub', rawTitle));
    const hb = mk('div', 'dl-hb');
    const bMin = mk('button', 'dl-x', '—'); bMin.type = 'button'; bMin.title = T('Ciutkan / buka');
    bMin.addEventListener('click', () => box.classList.toggle('min'));
    const x = mk('button', 'dl-x', '✕'); x.type = 'button'; x.title = T('Tutup (Esc)');
    x.addEventListener('click', closeDl);
    hb.append(bMin, x);
    head.append(hl, hb);

    const bar = mk('div', 'dl-bar');
    const bAll = mk('button', 'dl-btn', T('Pilih semua'));
    const bNone = mk('button', 'dl-btn', T('Kosongkan'));
    const bInv = mk('button', 'dl-btn', T('Balik pilihan'));
    [bAll, bNone, bInv].forEach((b) => { b.type = 'button'; });
    const hint = mk('span', 'dl-hint', T('Klik = pilih/batal · Shift+klik = rentang'));
    const zBox = mk('div', 'dl-q');
    const zIn = document.createElement('input');
    zIn.type = 'range'; zIn.min = 90; zIn.max = 320; zIn.step = 10; zIn.value = state.dlThumb; zIn.title = T('Ukuran thumbnail');
    zBox.append(mk('span', 'dl-lbl', T('Ukuran')), zIn);
    zIn.addEventListener('input', () => { state.dlThumb = +zIn.value; set('dlThumb', state.dlThumb); box.style.setProperty('--dl-th', state.dlThumb + 'px'); });
    const count = mk('span', 'dl-count');
    bar.append(bAll, bNone, bInv, hint, zBox, count);

    // ---- baris opsi: Hasil (ZIP/PDF/Gambar), Format (Asli/JPG), Simpan ke (Unduhan/Folder) ----
    if (!HAS_DIR) {
      if (state.dlDest === 'dir') state.dlDest = 'dl';
      if (state.dlOut === 'img') state.dlOut = 'zip';
    }
    const bar2 = mk('div', 'dl-bar');
    const mkSeg = (items, key, onSet) => {
      const wrap = mk('div', 'dl-seg');
      const btns = items.map(([v, t]) => {
        const b = mk('button', '', T(t)); b.type = 'button'; b.dataset.v = v;
        b.addEventListener('click', () => { state[key] = v; set(key, v); if (onSet) onSet(v); syncOpts(); });
        wrap.appendChild(b); return b;
      });
      return { wrap, btns };
    };
    const outSeg = mkSeg([['zip', 'ZIP'], ['pdf', 'PDF']].concat(HAS_DIR ? [['img', 'Gambar']] : []), 'dlOut',
      (v) => { if (v === 'img') { state.dlDest = 'dir'; set('dlDest', 'dir'); } });
    const fmtLbl = mk('span', 'dl-lbl', T('Format'));
    const fmtSeg = mkSeg([['orig', 'Asli'], ['jpg', 'JPG']], 'dlFmt');
    const qBox = mk('div', 'dl-q');
    const qIn = document.createElement('input');
    qIn.type = 'range'; qIn.min = 50; qIn.max = 100; qIn.step = 5; qIn.title = T('Kualitas JPG');
    const qVal = mk('span');
    qBox.append(qIn, qVal);
    qIn.addEventListener('input', () => { state.dlQ = +qIn.value; set('dlQ', state.dlQ); qVal.textContent = state.dlQ + '%'; });
    const destLbl = mk('span', 'dl-lbl', T('Simpan ke'));
    const destSeg = mkSeg([['dl', 'Unduhan']].concat(HAS_DIR ? [['dir', 'Folder']] : []), 'dlDest',
      (v) => { if (v === 'dl' && state.dlOut === 'img') { state.dlOut = 'zip'; set('dlOut', 'zip'); } });
    const bFolder = mk('button', 'dl-btn dl-folder'); bFolder.type = 'button';
    bFolder.addEventListener('click', async () => {
      try { await pickDir(); } catch (e) { if (e && e.name !== 'AbortError') console.warn('[HMT] pilih folder gagal', e); }
      syncOpts();
    });
    bar2.append(mk('span', 'dl-lbl', T('Hasil')), outSeg.wrap, fmtLbl, fmtSeg.wrap, qBox, destLbl, destSeg.wrap, bFolder);
    const syncOpts = () => {
      const pdf = state.dlOut === 'pdf';
      outSeg.btns.forEach((b) => b.classList.toggle('on', b.dataset.v === state.dlOut));
      fmtSeg.btns.forEach((b) => b.classList.toggle('on', b.dataset.v === state.dlFmt));
      destSeg.btns.forEach((b) => b.classList.toggle('on', b.dataset.v === state.dlDest));
      fmtLbl.classList.toggle('dl-hide', pdf); fmtSeg.wrap.classList.toggle('dl-hide', pdf); // PDF selalu JPEG
      qBox.classList.toggle('dl-hide', !(pdf || state.dlFmt === 'jpg'));
      destLbl.classList.toggle('dl-hide', !HAS_DIR); destSeg.wrap.classList.toggle('dl-hide', !HAS_DIR);
      bFolder.classList.toggle('dl-hide', state.dlDest !== 'dir');
      bFolder.textContent = dirHandle ? '📁 ' + dirHandle.name : T('Pilih folder…');
      qIn.value = state.dlQ; qVal.textContent = state.dlQ + '%';
      refresh();
    };

    const grid = mk('div', 'dl-grid');
    const cells = [];
    const th = thumbHost && thumbHost.isConnected ? thumbHost.querySelectorAll('.hm-th img') : null;
    files.forEach((f, i) => {
      const item = mk('div', 'dl-item');
      const c = mk('div', 'dl-cell on');
      const img = document.createElement('img');
      img.loading = 'lazy'; img.decoding = 'async'; img.alt = '';
      const first = th && th[i] ? (th[i].currentSrc || th[i].getAttribute('src') || '') : '';
      const list = [first, ...candidates(f)].filter(Boolean);
      let k = 0;
      img.addEventListener('error', () => { if (++k < list.length) img.src = list[k]; });
      if (list.length) img.src = list[0];
      c.append(img, mk('span', 'dl-n', String(i + 1)), mk('span', 'dl-ck', '✓'));
      item.dataset.i = String(i);
      item.appendChild(c);
      grid.appendChild(item);
      cells.push(c);
    });

    const foot = mk('div', 'dl-foot');
    const stat = mk('div', 'dl-stat');
    const bCancel = mk('button', 'dl-btn', T('Tutup')); bCancel.type = 'button';
    const bGo = mk('button', 'dl-btn pri'); bGo.type = 'button';
    foot.append(stat, bCancel, bGo);

    box.append(head, bar, bar2, grid, foot);

    let last = null;
    const paint = (i) => {
      const on = sel.has(i);
      cells[i].classList.toggle('on', on);
      cells[i].classList.toggle('off', !on);
      cells[i].querySelector('.dl-ck').textContent = on ? '✓' : '';
    };
    const refresh = () => {
      count.textContent = T('{0} / {1} dipilih', sel.size, total);
      bGo.textContent = T(state.dlDest === 'dir' ? 'Simpan {0} ({1})' : 'Unduh {0} ({1})', outName(state.dlOut), sel.size);
      bGo.classList.toggle('off', !sel.size);
      stat.textContent = sel.size ? T('Siap mengunduh {0} gambar · berjalan di latar belakang, boleh pindah halaman', sel.size) : T('Belum ada gambar dipilih');
    };
    const setAll = (fn) => { for (let i = 0; i < total; i++) { if (fn(i)) sel.add(i); else sel.delete(i); paint(i); } refresh(); };
    bAll.addEventListener('click', () => setAll(() => true));
    bNone.addEventListener('click', () => setAll(() => false));
    bInv.addEventListener('click', () => setAll((i) => !sel.has(i)));

    grid.addEventListener('click', (e) => {
      const it = e.target.closest('.dl-item');
      if (!it) return;
      const i = +it.dataset.i;
      const on = !sel.has(i);
      if (e.shiftKey && last !== null) {
        const [a, b] = last < i ? [last, i] : [i, last];
        for (let j = a; j <= b; j++) { if (on) sel.add(j); else sel.delete(j); paint(j); }
      } else {
        if (on) sel.add(i); else sel.delete(i);
        paint(i);
      }
      last = i;
      refresh();
    });

    bCancel.addEventListener('click', closeDl);

    bGo.addEventListener('click', async () => {
      if (!sel.size) return;
      const out = state.dlOut;
      const toDir = HAS_DIR && (out === 'img' || state.dlDest === 'dir');
      if (toDir) { // harus dipanggil langsung dari klik (user gesture)
        try { await ensureDir(); }
        catch (e) {
          syncOpts();
          if (e && e.name === 'AbortError') toast('Pemilihan folder dibatalkan');
          else toast(T('Tidak bisa mengakses folder: {0}', (e && e.message) || e), { type: 'err' });
          return;
        }
        syncOpts();
      }
      const idxs = [...sel].sort((a, b) => a - b);
      const job = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: rawTitle, subName, gid: String(info.id || ''),
        fname: out === 'pdf' ? subName + '.pdf' : zipName,
        out, asJpg: out !== 'pdf' && state.dlFmt === 'jpg', q: state.dlQ,
        dest: toDir ? 'dir' : 'dl',
        pad: Math.max(3, String(total).length),
        items: idxs.map((i) => ({ i, urls: candidates(files[i]) })),
        failed: [], done: 0, kept: 0, status: 'queued', created: Date.now(),
      };
      try { await jobPut(job); }
      catch (e) { toast(T('Gagal menambahkan ke antrian: {0}', (e && e.message) || e), { type: 'err' }); return; }
      closeDl();
      toast(T('Ditambahkan ke antrian: {0} gambar. Boleh pindah halaman, unduhan tetap jalan.', idxs.length), { type: 'ok' });
      kick();
      dmTick();
    });

    // muat folder tujuan terakhir (kalau pernah dipilih)
    if (HAS_DIR && !dirHandle) idbGet('dir').then((h) => { if (h) { dirHandle = h; syncOpts(); } }).catch(() => {});
    syncOpts();
    refresh();
    document.body.appendChild(dlEl);

    // posisi & ukuran awal (diingat), lalu aktifkan geser + resize
    const r = get('dlRect', null);
    const w = Math.min((r && r.w) || 980, innerWidth - 8), h = Math.min((r && r.h) || 760, innerHeight - 8);
    box.style.width = w + 'px'; box.style.height = h + 'px';
    box.style.left = (r && typeof r.x === 'number' ? r.x : Math.round((innerWidth - w) / 2)) + 'px';
    box.style.top = (r && typeof r.y === 'number' ? r.y : Math.round((innerHeight - h) / 2)) + 'px';
    keepInView(box);
    attachDrag(box, head, 'dlRect');
    attachResize(box, 'dlRect', 460, 320);
    head.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) box.classList.toggle('min'); });
    const onWin = () => keepInView(box);
    window.addEventListener('resize', onWin);
    dlCleanup = () => window.removeEventListener('resize', onWin);
  }

  // Intercept klik tombol Download bawaan situs (fase capture, sebelum handler situs).
  window.addEventListener('click', (e) => {
    if (!state.dlPanel || e.button !== 0) return;
    const t = e.target && e.target.closest && e.target.closest('#dl-button');
    if (!t) return;
    const info = window.galleryinfo;
    if (!(info && info.files && info.files.length && window.gg)) return; // data belum siap: pakai download bawaan
    e.preventDefault(); e.stopImmediatePropagation();
    openDownloadPanel();
  }, true);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dlEl && !modalOpen) { e.stopImmediatePropagation(); closeDl(); }
  }, true);

  onReady(() => { initPanel(); dmStart(); });
})();
