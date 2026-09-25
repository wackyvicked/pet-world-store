/* WOW Pets shared cart — single cart UI/behavior for every storefront page. */
(function(){
  "use strict";
  const KEY="wowPetsCart";
  function read(){try{const a=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(a)?a.filter(x=>x&&x.id!=null&&String(x.id)!==""&&Number(x.q)>0).map(x=>({id:String(x.id),q:Number(x.q)})):[]}catch(e){return[]}}
  function write(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
  function products(){return Array.isArray(window.P)?window.P:(Array.isArray(window.productList)?window.productList:[])}
  function productId(p){const n=norm(p);return n.id!=null?String(n.id):null}
  function migrate(){const ps=products();let raw=[];try{const a=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(a))raw=a}catch(e){}let changed=false;const out=[];raw.forEach(x=>{if(!x||Number(x.q)<=0)return;if(x.id!=null&&String(x.id)!==""){const id=String(x.id);const found=out.find(v=>v.id===id);if(found)found.q+=Number(x.q);else out.push({id,q:Number(x.q)});if(x.i!=null||x.p)changed=true;return}if(Number.isInteger(Number(x.i))&&ps[Number(x.i)]){const id=productId(ps[Number(x.i)]);if(id){const found=out.find(v=>v.id===id);if(found)found.q+=Number(x.q);else out.push({id,q:Number(x.q)});changed=true}}});if(changed||out.length!==raw.length)write(out);return out}
  function resolve(ps,x){return x&&x.id!=null?ps.findIndex(p=>productId(p)===String(x.id)):-1}
  function norm(p){
    if(Array.isArray(p)) return {id:p[4],name:p[0],price:Number(p[1])||0,sale:Number(p[9])||0,image:p[2]||"",weight:p[7],unit:p[8]};
    return {id:p?.id,name:p?.name||p?.product_name,price:Number(p?.price)||0,sale:Number(p?.sale_price)||0,image:p?.image_url||p?.image||"",weight:p?.weight,unit:p?.unit};
  }
  function price(p){return p.sale>0&&p.sale<p.price?p.sale:p.price}
  function ensure(){
    if(document.getElementById("wowSharedCart")) return;
    const style=document.createElement("style");
    style.textContent=".wow-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2000;opacity:0;visibility:hidden;transition:.25s}.wow-cart-overlay.open{opacity:1;visibility:visible}.wow-cart{position:fixed;top:0;right:0;bottom:0;left:auto;width:min(380px,88vw);height:100dvh;background:#fafafa;z-index:2001;transform:translateX(105%);opacity:0;transition:transform .3s ease,opacity .3s ease;display:flex;flex-direction:column;border-left:1px solid #d9d9d9;border-radius:22px 0 0 22px;box-shadow:-10px 0 30px rgba(0,0,0,.22);overflow:hidden}.wow-cart.open{transform:translateX(0);opacity:1}.wow-cart-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:#fff;border-bottom:1px solid #ddd}.wow-cart-head h2{margin:0;font:700 21px Poppins,Inter,Arial,sans-serif}.wow-cart-head button{width:38px;height:38px;border:1px solid #ddd;background:#f7f7f7;border-radius:50%;font-size:27px;cursor:pointer}.wow-cart-items{flex:1;overflow:auto;padding:12px;background:#f6f6f6}.wow-cart-row{display:flex;gap:10px;align-items:center;padding:12px;margin-bottom:9px;background:#fff;border:1px solid #e2e2e2;border-radius:10px}.wow-cart-img{width:58px;height:58px;flex:0 0 58px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:8px;background:#f3f3f3;border:1px solid #eee}.wow-cart-img img{width:100%;height:100%;object-fit:contain}.wow-cart-info{flex:1;min-width:0}.wow-cart-name{font-weight:700;font-size:14px;line-height:1.25}.wow-cart-price{font-size:13px;margin-top:4px;color:#555}.wow-cart-qty{display:flex;align-items:center;gap:5px}.wow-cart-qty button{width:30px;height:30px;border:1px solid #d5d5d5;background:#fff;border-radius:7px;font-size:18px;cursor:pointer}.wow-cart-qty span{min-width:20px;text-align:center;font-weight:700}.wow-cart-empty{text-align:center;color:#777;padding:45px 15px;background:#fff;border:1px dashed #d5d5d5;border-radius:10px}.wow-cart-foot{padding:15px 16px;background:#fff;border-top:1px solid #d8d8d8}.wow-cart-total{display:flex;justify-content:space-between;font-weight:800;margin-bottom:12px}.wow-cart-checkout{width:100%;border:0;background:#f7c600;color:#111;padding:13px;border-radius:9px;font-weight:800;font-size:16px;cursor:pointer}@media(max-width:700px){.wow-cart{height:min(82vh,680px)}}";
    document.head.appendChild(style);
    const wrap=document.createElement("div");
    wrap.innerHTML='<div id="wowCartOverlay" class="wow-cart-overlay"></div><aside id="wowSharedCart" class="wow-cart" aria-label="Shopping cart"><div class="wow-cart-head"><h2>Your Cart</h2><button type="button" id="wowCartClose" aria-label="Close cart">×</button></div><div id="wowCartItems" class="wow-cart-items"></div><div class="wow-cart-foot"><div class="wow-cart-total"><span>Total</span><strong id="wowCartTotal">PKR 0</strong></div><button type="button" id="wowCartCheckout" class="wow-cart-checkout">Checkout</button></div></aside>';
    document.body.appendChild(wrap);
    document.getElementById("wowCartOverlay").onclick=close;
    document.getElementById("wowCartClose").onclick=close;
    document.getElementById("wowCartCheckout").onclick=checkout;
  }
  function available(){const ps=products(),a=migrate();if(!ps.length)return a;const valid=a.filter(x=>resolve(ps,x)>=0);if(valid.length!==a.length)write(valid);return valid}
  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
  function render(){ensure();const ps=products(),a=available(),box=document.getElementById("wowCartItems"),total=document.getElementById("wowCartTotal");let sum=0;if(!a.length){box.innerHTML='<div class="wow-cart-empty">Your cart is empty.</div>';total.textContent="PKR 0";badges();return}box.innerHTML=a.map(x=>{const i=resolve(ps,x),p=i>=0?norm(ps[i]):null;if(!p)return "";const pr=price(p);sum+=pr*x.q;return '<div class="wow-cart-row"><div class="wow-cart-img">'+(p.image?'<img src="'+esc(p.image)+'" alt="">':'🐾')+'</div><div class="wow-cart-info"><div class="wow-cart-name">'+esc(p.name||"Product")+'</div><div class="wow-cart-price">PKR '+pr.toLocaleString()+'</div></div><div class="wow-cart-qty"><button type="button" data-ci="'+esc(x.id)+'" data-d="-1">−</button><span>'+x.q+'</span><button type="button" data-ci="'+esc(x.id)+'" data-d="1">+</button></div></div>'}).join("");box.querySelectorAll("[data-ci]").forEach(b=>b.onclick=()=>change(String(b.dataset.ci),Number(b.dataset.d)));total.textContent="PKR "+sum.toLocaleString();badges()}
  function badges(){const n=migrate().reduce((s,x)=>s+Number(x.q||0),0);document.querySelectorAll(".cart-badge,.cart-count,.cart-btn .badge,.icon-btn .badge,.bottom-item .badge").forEach(e=>e.textContent=n);const b=document.getElementById("productBottomCount");if(b)b.textContent=n}
  function open(){ensure();render();document.getElementById("wowCartOverlay").classList.add("open");document.getElementById("wowSharedCart").classList.add("open")}
  function close(){const c=document.getElementById("wowSharedCart"),o=document.getElementById("wowCartOverlay");if(c)c.classList.remove("open");if(o)o.classList.remove("open")}
  function change(id,d){const a=read(),x=a.find(v=>v.id===String(id));if(!x)return;x.q+=d;if(x.q<1)a.splice(a.indexOf(x),1);write(a);render()}
  function checkout(){const a=available();if(!a.length){alert("Your cart is empty.");return}close();if(typeof window.checkout==="function"){try{window.__sharedCheckoutItems=a.filter(x=>resolve(products(),x)>=0).map(x=>({id:x.id,q:x.q}));window.checkout()}finally{window.__sharedCheckoutItems=null}return}location.href="./index.html#cart"}
  function add(i,q){const ps=products(),p=ps[Number(i)];if(!p)return;const id=productId(p);if(!id)return;const a=migrate(),x=a.find(v=>v.id===id);if(x)x.q+=Number(q)||1;else a.push({id,q:Number(q)||1});write(a);render();open()}
  function bind(){
    migrate();
    ensure();
    document.querySelectorAll(".cart-btn,.head-actions .cart-btn").forEach(b=>{b.onclick=function(e){e.preventDefault();open();return false}});
    document.querySelectorAll("[onclick*='openCart'],[onclick*='openProductCart']").forEach(b=>{b.onclick=function(e){e.preventDefault();open();return false}});
    document.querySelectorAll(".bottom-item").forEach(b=>{if(/cart/i.test(b.textContent||""))b.onclick=function(e){e.preventDefault();open();return false}});
    /* Menu buttons with inline toggleMenu() are already handled by the page.
       Do not add a second listener or the menu will toggle twice. */
    document.querySelectorAll(".menu-btn").forEach(b=>{
      if(/toggleMenu/.test(b.getAttribute("onclick")||""))return;
      if(b.dataset.wowMenuBound==="1")return;
      b.dataset.wowMenuBound="1";
      b.addEventListener("click",function(e){
        e.preventDefault();
        e.stopPropagation();
        const nav=(b.closest("header")||document).querySelector(".nav");
        if(!nav)return;
        const isOpen=nav.classList.toggle("open");
        b.setAttribute("aria-expanded",isOpen?"true":"false");
        b.classList.toggle("is-open",isOpen);
      });
    });
    document.querySelectorAll(".nav a").forEach(a=>{
      if(a.dataset.wowMenuLinkBound==="1")return;
      a.dataset.wowMenuLinkBound="1";
      a.addEventListener("click",function(){
        const nav=a.closest(".nav");
        if(nav)nav.classList.remove("open");
        const backdrop=document.getElementById("menuBackdrop");
        if(backdrop)backdrop.classList.remove("open");
        const btn=document.querySelector(".menu-btn");
        if(btn)btn.setAttribute("aria-expanded","false");
        document.body.style.overflow="";
      });
    });
    document.querySelectorAll(".pcart,.pcart-overlay").forEach(e=>{if(!e.closest("#wowSharedCart"))e.style.display="none"});
    badges();
  }
  if(typeof window.toggleMenu!=="function"){window.toggleMenu=function(){const nav=document.getElementById("mainNav")||document.querySelector(".nav");if(!nav)return false;const isOpen=nav.classList.toggle("open");const b=document.querySelector(".menu-btn");if(b){b.setAttribute("aria-expanded",isOpen?"true":"false");b.classList.toggle("is-open",isOpen)}return false};}
  window.WOWSharedCart={open,close,add,render,read,available};
  window.openProductCart=open;
  window.openCart=open;
  window.closeProductCart=close;
  window.closeCart=close;
  document.addEventListener("DOMContentLoaded",bind);
  window.addEventListener("storage",()=>{render();badges()});
  setTimeout(bind,0);setTimeout(bind,1200);
  if(location.hash==="#cart")setTimeout(open,900);
})();