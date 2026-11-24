/* Рейтинг у порядку показу: від Honourable Mention до 1 місця.
   city — ключ міста з js/europe-data.js (london, liverpool, oxford, birmingham). Щоб додати місто, правте scripts/build-map.mjs.
   start — секунда треку, з якої починається фрагмент (довжина фрагмента — FRAGMENT у js/player.js). */
window.RANKING = [
  {place: 'Honourable Mention', band: 'Sex Pistols',   city: 'london',     album: 'Never Mind The Bollocks, Here\'s The Sex Pistols', year: 1977, track: 'Holidays In The Sun',
   cover: 'assets/covers/sex-pistols_holidays in the sun_cover.jpg',         audio: 'assets/audio/sex-pistols_holidays in the sun.mp3',     start: 6,
   video: 'assets/video/sex-pistols.mp4', poster: 'assets/video/sex-pistols.jpg'},
  {place: '4 місце',            band: 'The Beatles',   city: 'liverpool',  album: 'Revolver',                        year: 1966, track: 'I\'m Only Sleeping',
   cover: 'assets/covers/the-beatles_im-only-sleeping_cover.jpg',            audio: 'assets/audio/the-beatles_im-only-sleeping.mp3',        start: 19,
   video: 'assets/video/beatles.mp4', poster: 'assets/video/beatles.jpg'},
  {place: '3 місце',            band: 'Carcass',       city: 'liverpool',  album: 'Heartwork',                       year: 1993, track: 'Buried Dreams',
   cover: 'assets/covers/carcass_heartwork_cover.jpg',                       audio: 'assets/audio/carcass-buried-dreams.mp3',               start: 148,
   video: 'assets/video/carcass.mp4', poster: 'assets/video/carcass.jpg'},
  {place: '2 місце',            band: 'Black Sabbath', city: 'birmingham', album: 'Black Sabbath',                   year: 1970, track: 'Black Sabbath',
   cover: 'assets/covers/black-sabbath_black-sabbath_cover.jpg',             audio: 'assets/audio/black-sabbath_black-sabbath.mp3',         start: 38,
   video: 'assets/video/black-sabbath.mp4', poster: 'assets/video/black-sabbath.jpg'},
  {place: '1 місце',            band: 'Radiohead',     city: 'oxford',     album: 'Kid A',                           year: 2000, track: 'Idioteque',
   cover: 'assets/covers/radiohead_idioteque_cover.jpg',                     audio: 'assets/audio/radiohead_idioteque.mp3',                 start: 103,
   video: 'assets/video/radiohead.mp4', poster: 'assets/video/radiohead.jpg'}
];
