/* S.u.G SWAG YouTube Official Link & Opt-in Privacy-Enhanced Embed Helper
   Strictly prohibits downloading, rehosting, or unauthorized redistribution. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SuGSwagYouTube = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FEATURED_CHANNELS = [
    {
      id: 'zubora-stretch-fukai',
      title: 'ズボラストレッチ（深井裕樹氏）公式チャンネル',
      category: '紹介チャンネル',
      url: 'https://www.youtube.com/@zuborastretch',
      partnershipStatus: 'CONTACTED_AWAITING_REPLY',
      statusBadge: 'ご連絡済み・返信待ち（未提携／公式リンク紹介）',
      note: 'ご本人に連携のご連絡済みで現在返信待ちのため、正式提携とは表記せず、公式YouTubeチャンネルへの外部リンクのみご案内しています。'
    }
  ];

  function isOfficialYouTubeUrl(url) {
    if (typeof url !== 'string') return false;
    try {
      var u = new URL(url.trim());
      if (u.protocol !== 'https:') return false;
      var h = u.hostname.toLowerCase();
      return h === 'www.youtube.com' || h === 'youtube.com' || h === 'm.youtube.com' || h === 'youtu.be';
    } catch (e) {
      return false;
    }
  }

  function extractVideoId(url) {
    if (!isOfficialYouTubeUrl(url)) return null;
    try {
      var u = new URL(url.trim());
      var h = u.hostname.toLowerCase();
      if (h === 'youtu.be') {
        var id = u.pathname.replace(/^\//, '').split('/')[0];
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (u.pathname === '/watch') {
        var v = u.searchParams.get('v') || '';
        return /^[A-Za-z0-9_-]{11}$/.test(v) ? v : null;
      }
      var m = /^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})/.exec(u.pathname);
      return m ? m[1] : null;
    } catch (e) {
      return null;
    }
  }

  function buildNoCookieEmbedUrl(url) {
    var vid = extractVideoId(url);
    return vid ? ('https://www.youtube-nocookie.com/embed/' + vid + '?rel=0') : null;
  }

  return {
    FEATURED_CHANNELS: FEATURED_CHANNELS,
    isOfficialYouTubeUrl: isOfficialYouTubeUrl,
    extractVideoId: extractVideoId,
    buildNoCookieEmbedUrl: buildNoCookieEmbedUrl
  };
});
