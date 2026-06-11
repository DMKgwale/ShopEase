const apiBase = '/api';
let allProducts = [];

function cartKey(){ return 'shopease_cart_v1'; }
function getCart(){ return JSON.parse(localStorage.getItem(cartKey()) || '[]'); }
function saveCart(c){ localStorage.setItem(cartKey(), JSON.stringify(c)); renderCart(); updateCartCount(); }

function updateCartCount(){
  const cnt = getCart().reduce((s,i)=>s+i.quantity,0);
  const el = document.getElementById('cartCount'); if (el) el.textContent = cnt;
}

function addToCart(product_id, name, price){
  const cart = getCart();
  const item = cart.find(i=>i.product_id===product_id);
  if (item) item.quantity+=1; else cart.push({ product_id, name, price, quantity:1 });
  saveCart(cart);
}

function removeFromCart(product_id){
  let cart = getCart(); cart = cart.filter(i=>i.product_id!==product_id); saveCart(cart);
}

function clearCart(){ localStorage.removeItem(cartKey()); renderCart(); updateCartCount(); }

function renderCart(){
  const box = document.getElementById('cartItems');
  const cart = getCart();
  if (!box) return;
  if (cart.length===0) { box.innerHTML = '<div class="empty">Your cart is empty</div>'; return; }
  box.innerHTML = '';
  cart.forEach(i=>{
    const d = document.createElement('div'); d.className='cart-item';
    d.innerHTML = `<div><strong>${i.name}</strong></div><div class="meta">Qty: ${i.quantity} - $${(i.price*i.quantity).toFixed(2)}</div>`;
    const rm = document.createElement('button'); rm.className='btn'; rm.textContent='Remove'; rm.onclick=()=>{ removeFromCart(i.product_id); };
    d.appendChild(rm);
    box.appendChild(d);
  });
}

async function loadProducts(){
  const res = await fetch(apiBase + '/products');
  allProducts = await res.json();
  renderProducts();
}

function renderProducts(){
  const container = document.getElementById('productGrid');
  if (!container) return;
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const sort = document.getElementById('sortSelect')?.value || 'default';
  let list = allProducts.slice();
  if (q) list = list.filter(p => (p.name||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
  if (sort === 'price_asc') list.sort((a,b)=>a.price-b.price);
  if (sort === 'price_desc') list.sort((a,b)=>b.price-a.price);

  container.innerHTML = '';
  list.forEach(p=>{
    const el = document.createElement('article'); el.className='card';
    const imgUrl = p.image_url || 'https://picsum.photos/seed/'+encodeURIComponent(p.name || p.id)+"/400/300";
    el.innerHTML = `<a class="card-link" href="#/product/${p.id}"><img src="${imgUrl}" alt="${p.name}"></a><h4><a href="#/product/${p.id}">${p.name}</a></h4><div class="meta">${p.description || ''}</div><div class="price">$${p.price.toFixed(2)}</div>`;
    const actions = document.createElement('div'); actions.className='actions';
    const btn = document.createElement('button'); btn.className='btn primary'; btn.textContent='Add to cart'; btn.onclick = ()=> addToCart(p.id, p.name, p.price);
    actions.appendChild(btn);
    el.appendChild(actions);
    container.appendChild(el);
  });
}

// Product detail
async function showProductDetail(id){
  const container = document.getElementById('detailContent');
  if (!container) return;
  container.innerHTML = '<div class="empty">Loading...</div>';
  try{
    const res = await fetch(apiBase + '/products/' + id);
    if (!res.ok) return container.innerHTML = '<div class="empty">Product not found</div>';
    const p = await res.json();
    const imgUrl = p.image_url || 'https://picsum.photos/seed/'+encodeURIComponent(p.name || p.id)+"/600/400";
    container.innerHTML = `
      <div class="media">
        <img src="${imgUrl}" alt="${p.name}">
        <div class="info">
          <h3>${p.name}</h3>
          <div class="price">$${p.price.toFixed(2)}</div>
          <div class="meta">${p.description || ''}</div>
          <div class="meta">In stock: ${p.inventory}</div>
          <label>Quantity <input id="detailQty" type="number" min="1" value="1" style="width:80px"></label>
          <div style="margin-top:8px"><button id="detailAdd" class="btn primary">Add to cart</button></div>
        </div>
      </div>
    `;
    document.getElementById('detailBack').onclick = ()=> { location.hash = '#/products'; };
    document.getElementById('detailAdd').onclick = ()=>{
      const q = Number(document.getElementById('detailQty').value) || 1;
      for(let i=0;i<q;i++) addToCart(p.id, p.name, p.price);
      alert('Added to cart');
      updateCartCount();
    };
  }catch(e){ container.innerHTML = '<div class="empty">Error loading product</div>'; }
}

async function checkout(){
  const name = prompt('Your name');
  const email = prompt('Email');
  const address = prompt('Shipping address');
  if (!name || !email || !address) return alert('Cancelled');
  const cart = getCart();
  const payload = { customer_name: name, customer_email: email, address, items: cart.map(i=>({ product_id: i.product_id, quantity: i.quantity })) };
  const res = await fetch(apiBase + '/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const data = await res.json();
  if (res.ok) { clearCart(); alert('Order placed: ID ' + (data.order_id || data.id || 'unknown')); }
  else alert('Error: ' + (data.error||'Unknown'));
}

const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) checkoutBtn.addEventListener('click', ()=> { location.hash = '#/checkout'; });
const clearBtn = document.getElementById('clearCartBtn');
if (clearBtn) clearBtn.addEventListener('click', clearCart);
const searchInput = document.getElementById('searchInput');
if (searchInput) searchInput.addEventListener('input', ()=> { if (currentRoute()==='/products') renderProducts(); });
const sortSelect = document.getElementById('sortSelect');
if (sortSelect) sortSelect.addEventListener('change', ()=> { if (currentRoute()==='/products') renderProducts(); });

function currentRoute(){
  const h = location.hash.replace(/^#/, '') || '/';
  return h.split('?')[0];
}

function showPage(route){
  const all = Array.from(document.querySelectorAll('.page'));
  const targetId = routeToId(route);
  all.forEach(el=>{
    if (!el) return;
    if (el.id === targetId){
      el.style.display = 'block';
      requestAnimationFrame(()=> el.classList.add('active'));
    } else {
      el.classList.remove('active');
      // hide after transition
      setTimeout(()=>{ if (el.id !== targetId) el.style.display = 'none'; }, 300);
    }
  });
  // update nav active
  document.querySelectorAll('.nav-link').forEach(a=>{ a.classList.toggle('active', a.getAttribute('data-route') === route); });
}

function routeToId(route){
  switch(route){
    case '/products': return 'productsPage';
    case '/cart': return 'cartPage';
    case '/checkout': return 'checkoutPage';
    default: return 'homePage';
  }
}

async function handleCheckoutFormSubmit(ev){
  ev.preventDefault();
  const form = ev.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const address = form.address.value.trim();
  if (!name || !email || !address) return alert('Please fill all fields');
  const cart = getCart();
  if (cart.length===0) return alert('Cart is empty');
  const payload = { customer_name: name, customer_email: email, address, items: cart.map(i=>({ product_id: i.product_id, quantity: i.quantity })) };
  const res = await fetch(apiBase + '/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const data = await res.json();
  if (res.ok) { clearCart(); localStorage.removeItem(checkoutDraftKey); alert('Order placed: ID ' + (data.order_id || data.id || 'unknown')); location.hash = '#/'; }
  else alert('Error: ' + (data.error||'Unknown'));
}

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutFormSubmit);

// Persist checkout drafts
const checkoutDraftKey = 'shopease_checkout_draft';
function saveCheckoutDraft(){
  const form = document.getElementById('checkoutForm'); if (!form) return;
  const draft = { name: form.name.value || '', email: form.email.value || '', address: form.address.value || '' };
  localStorage.setItem(checkoutDraftKey, JSON.stringify(draft));
}

function loadCheckoutDraftToForm(){
  const form = document.getElementById('checkoutForm'); if (!form) return;
  const raw = localStorage.getItem(checkoutDraftKey); if (!raw) return;
  try{ const draft = JSON.parse(raw); form.name.value = draft.name || ''; form.email.value = draft.email || ''; form.address.value = draft.address || ''; }catch(e){}
}

// wire draft autosave
if (checkoutForm){ ['name','email','address'].forEach(name=>{
  const el = checkoutForm.elements[name]; if (!el) return; el.addEventListener('input', ()=>{ saveCheckoutDraft(); });
}); }

function route(){
  const r = currentRoute();
  showPage(r);
  if (r === '/products') renderProducts();
  else if (r === '/cart') renderCart();
  else if (r.startsWith('/product/')){
    const id = r.split('/')[2]; showProductDetail(id);
  } else if (r === '/checkout'){
    // load checkout draft into form
    loadCheckoutDraftToForm();
  }
}

window.addEventListener('hashchange', route);

// wire nav links
document.querySelectorAll('.nav-link').forEach(a=> a.addEventListener('click', (e)=>{ e.preventDefault(); const route = a.getAttribute('data-route') || '/'; location.hash = '#' + route; }));

loadProducts(); renderCart(); updateCartCount();
route();
