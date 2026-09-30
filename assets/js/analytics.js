(function(){
  var c = window.DOCFLOW_CONFIG;
  var storageKey = "docflow_analytics_consent";
  var analyticsLoaded = false;
  var savedConsent = null;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };

  try { savedConsent = localStorage.getItem(storageKey); } catch(e) {}

  function loadAnalytics(){
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    if (c.GA4_ID && c.GA4_ID.indexOf("XXXX") === -1) {
      var ga = document.createElement("script");
      ga.async = true;
      ga.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(c.GA4_ID);
      document.head.appendChild(ga);
      gtag("js", new Date());
      gtag("config", c.GA4_ID, {anonymize_ip:true});
    }

    if (c.CLARITY_ID && c.CLARITY_ID.indexOf("xxxx") === -1) {
      (function(c2,l,a,r,i,t,y){c2[a]=c2[a]||function(){(c2[a].q=c2[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",c.CLARITY_ID);
    }
  }

  function saveConsent(value){
    savedConsent = value;
    try { localStorage.setItem(storageKey, value); } catch(e) {}
    var banner = document.getElementById("consentBanner");
    if (banner) banner.hidden = true;
    if (value === "accepted") loadAnalytics();
  }

  if (savedConsent === "accepted") loadAnalytics();

  document.addEventListener("DOMContentLoaded", function(){
    var banner = document.getElementById("consentBanner");
    var privacy = document.getElementById("privacyDialog");
    if (banner && savedConsent !== "accepted" && savedConsent !== "essential") banner.hidden = false;

    var accept = document.getElementById("consentAccept");
    var essential = document.getElementById("consentEssential");
    if (accept) accept.addEventListener("click", function(){ saveConsent("accepted"); });
    if (essential) essential.addEventListener("click", function(){ saveConsent("essential"); });

    document.querySelectorAll("[data-privacy-open]").forEach(function(button){
      button.addEventListener("click", function(){
        if (privacy && typeof privacy.showModal === "function") privacy.showModal();
      });
    });
    document.querySelectorAll("[data-privacy-close]").forEach(function(button){
      button.addEventListener("click", function(){ if (privacy) privacy.close(); });
    });
    if (privacy) privacy.addEventListener("click", function(event){
      if (event.target === privacy) privacy.close();
    });
  });
})();
