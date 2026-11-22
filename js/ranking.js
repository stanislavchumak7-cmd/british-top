/* Рейтинг у порядку показу: від Honourable Mention до 1 місця.
   city — ключ міста з js/europe-data.js (london, liverpool, oxford). Щоб додати місто, правте scripts/build-map.mjs. */
window.RANKING = [
  {place: 'Honourable Mention', band: 'Queen',       city: 'london',    album: 'The Game',                        year: 1980, track: 'Another One Bites The Dust',
   cover: 'assets/covers/queen_the-game_cover.jpg',                          audio: 'assets/audio/queen-another-one-bites-the-dust.mp3',   start: 48,
   video: 'assets/video/queen.mp4', poster: 'assets/video/queen.jpg'},
  {place: '4 місце',            band: 'Carcass',     city: 'liverpool', album: 'Heartwork',                       year: 1993, track: 'Buried Dreams',
   cover: 'assets/covers/carcass_heartwork_cover.jpg',                       audio: 'assets/audio/carcass-buried-dreams.mp3',              start: 148,
   video: 'assets/video/carcass.mp4', poster: 'assets/video/carcass.jpg'},
  {place: '3 місце',            band: 'The Beatles', city: 'liverpool', album: 'Hey Jude',                        year: 1970, track: 'Hey Jude',
   cover: 'assets/covers/the-beatles_hey-jude_cover.jpg',                    audio: 'assets/audio/beatles-hey-jude.mp3',                   start: 69,
   video: 'assets/video/beatles.mp4', poster: 'assets/video/beatles.jpg'},
  {place: '2 місце',            band: 'David Bowie', city: 'london',    album: 'The Man Who Sold the World',      year: 1970, track: 'The Man Who Sold the World',
   cover: 'assets/covers/david-bowie_the-man-who-sold-the-world_cover.jpg',  audio: 'assets/audio/bowie-the-man-who-sold-the-world.mp3',   start: 45,
   video: 'assets/video/bowie.mp4', poster: 'assets/video/bowie.jpg'},
  {place: '1 місце',            band: 'Radiohead',   city: 'oxford',    album: 'In Rainbows',                     year: 2007, track: 'All I Need',
   cover: 'assets/covers/radiohead_in-rainbows_cover.jpg',                   audio: 'assets/audio/radiohead-all-i-need.mp3',               start: 144,
   video: 'assets/video/radiohead.mp4', poster: 'assets/video/radiohead.jpg'}
];
