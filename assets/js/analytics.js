(function(){
  var c = window.DOCFLOW_CONFIG;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  if (c.GA4_ID && c.GA4_ID.indexOf("XXXX") === -1) {
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + c.GA4_ID;
    document.head.appendChild(s);
    gtag("js", new Date()); gtag("config", c.GA4_ID);
  }
  if (c.CLARITY_ID && c.CLARITY_ID.indexOf("xxxx") === -1) {
    (function(c2,l,a,r,i,t,y){c2[a]=c2[a]||function(){(c2[a].q=c2[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",c.CLARITY_ID);
  }
})();
