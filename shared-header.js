/* WOW Pets shared header interactions for standalone customer pages. */
(function(){
  "use strict";
  function setMenu(open){
    var nav=document.getElementById("mainNav");
    var backdrop=document.getElementById("menuBackdrop");
    var btn=document.querySelector(".menu-btn");
    if(!nav)return false;
    nav.classList.toggle("open",!!open);
    if(backdrop)backdrop.classList.toggle("open",!!open);
    if(btn)btn.setAttribute("aria-expanded",open?"true":"false");
    document.body.style.overflow=open?"hidden":"";
    document.body.classList.toggle("menu-open",!!open);
    return false;
  }
  window.toggleMenu=function(event){
    if(event){event.preventDefault();event.stopPropagation();}
    var nav=document.getElementById("mainNav");
    return setMenu(!(nav&&nav.classList.contains("open")));
  };
  window.toggleSubmenu=function(id,button,event){
    if(event){event.preventDefault();event.stopPropagation();}
    var panel=document.getElementById(id);
    if(!panel||!button)return false;
    var open=!panel.classList.contains("open");
    panel.classList.toggle("open",open);
    button.classList.toggle("is-open",open);
    button.setAttribute("aria-expanded",open?"true":"false");
    return false;
  };
  /* These standalone pages do not own the store cart; send customers to the store. */
  window.openCart=function(){window.location.href="./index.html#shop";};
  document.addEventListener("keydown",function(event){
    if(event.key==="Escape")setMenu(false);
  });
  document.addEventListener("click",function(event){
    var nav=document.getElementById("mainNav");
    if(nav&&nav.classList.contains("open")&&event.target.closest("#mainNav a"))setMenu(false);
  });
  var search=document.getElementById("search");
  if(search){
    search.addEventListener("keydown",function(event){
      if(event.key!=="Enter")return;
      event.preventDefault();
      var query=search.value.trim();
      window.location.href="./search.html"+(query?"?q="+encodeURIComponent(query):"");
    });
  }
})();
