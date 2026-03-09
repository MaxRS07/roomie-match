(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function s(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerPolicy&&(n.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?n.credentials="include":o.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(o){if(o.ep)return;o.ep=!0;const n=s(o);fetch(o.href,n)}})();const ue=e=>{document.createElement("link");const t=document.createElement("link");t.rel="stylesheet",t.href=`/src/styles/${e}.css`,document.head.appendChild(t)};class pe{pages=new Map;currentPage=null;register(t){this.pages.set(t.name,t)}async navigate(t){if(this.currentPage===t)return;(this.currentPage?this.pages.get(this.currentPage):null)?.cleanup?.();let a=this.pages.get(t),o=t;if(a||(console.error(`Page ${t} not found, showing 404`),o="notfound",a=this.pages.get(o)),!a){console.error("Notfound page not registered");return}this.currentPage=o,a.render(),document.title=`${o.charAt(0).toUpperCase()+o.slice(1)} | Roomie Match`,ue(o),window.history.pushState({page:o},"",`/${o}`)}}const h=new pe;function O(e){return{user_id:e[0],name:e[1],email:e[2],password_hash:e[3],age:e[4],gender:e[5],occupation:e[6],bio:e[7],profile_photo:e[8],created_at:e[9]}}function ae(e){return{preference_id:e[0],user_id:e[1],cleanliness_level:e[2],sleep_schedule:e[3],pet_friendly:e[4],smoking_allowed:e[5],noise_tolerance:e[6],guests_allowed:e[7],work_schedule:e[8]}}function ne(e){return{listing_id:e[0],user_id:e[1],title:e[2],description:e[3],rent_price:e[4],location:e[5],city:e[6],state:e[7],zip_code:e[8],available_date:e[9],num_rooms:e[10],num_bathrooms:e[11],is_active:e[12],created_at:e[13]}}function ie(e){return{interest_id:e[0],renter_id:e[1],listing_id:e[2],status:e[3],created_at:e[4]}}function me(e){return{message_id:e[0],sender_id:e[1],receiver_id:e[2],content:e[3],sent_at:e[4],read:e[5]}}const fe="http://localhost:8000",ge=300*1e3,D=new Map;function ve(e,t){return`${e}:${JSON.stringify(t)}`}function he(e){const t=D.get(e);return t?Date.now()-t.timestamp>ge?(D.delete(e),null):t.data:null}function ye(e,t){D.set(e,{data:t,timestamp:Date.now()})}function X(e){if(!e)D.clear();else for(const t of D.keys())t.includes(e)&&D.delete(t)}async function y(e,t=[],s=!0){const a=ve(e,t);if(s){const o=he(a);if(o!==null)return{success:!0,data:o}}try{const o=await fetch(`${fe}/query`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,params:t})});if(!o.ok)throw new Error(`HTTP error! status: ${o.status}`);const n=await o.json(),l={success:!0,data:n.data};return s&&ye(a,n.data),l}catch(o){const n=o instanceof Error?o.message:"Unknown error";return console.error("Query error:",n),{success:!1,error:n}}}async function q(e){return y("SELECT * FROM Users WHERE user_id = ?",[e])}async function oe(e,t){const s=await y("SELECT * FROM Users WHERE email = ? AND password_hash = ?",[e,t]);if(s.success&&s.data&&s.data.length>0)return{success:!0,data:O(s.data[0])};throw new Error("Authentication failed: Invalid email or password")}async function re(e){return y("SELECT * FROM UserPreferences WHERE user_id = ?",[e])}async function Ee(e,t){const s=await y(`UPDATE UserPreferences SET 
            cleanliness_level = ?, sleep_schedule = ?, pet_friendly = ?,
            smoking_allowed = ?, noise_tolerance = ?, guests_allowed = ?, work_schedule = ?
         WHERE user_id = ?`,[t.cleanliness_level??"",t.sleep_schedule??"",t.pet_friendly??"",t.smoking_allowed??"",t.noise_tolerance??"",t.guests_allowed??"",t.work_schedule??"",e],!1);return X("UserPreferences"),s}async function be(e,t){const s=await y("UPDATE User SET name = ?, email = ?, age = ?, gender = ?, occupation = ?, bio = ? WHERE user_id = ?",[t.name??"",t.email??"",t.age??"",t.gender??"",t.occupation??"",t.bio??"",e],!1);X("Users");const a=localStorage.getItem("authToken");return a&&localStorage.removeItem("user:"+a),s}async function we(e,t){const s=await y("UPDATE ProfilePhoto SET data = ? WHERE user_id = ?",[t,e],!1);return X("ProfilePhoto"),s}async function N(e){const t=await y("SELECT data FROM ProfilePhoto WHERE user_id = ?",[e]);return t.success&&t.data&&t.data.length>0?t.data[0][0]:null}async function _e(e){return y(`
        SELECT 
            sender_id, 
            SUM(CASE WHEN Messages.read = 'False' THEN 1 ELSE 0 END) AS unread_count
        FROM Messages
        WHERE receiver_id = ? OR sender_id = ?
        GROUP BY sender_id
        ORDER BY unread_count DESC, sender_id DESC;
    `,[e,e])}async function Le(e,t){return y(`
        SELECT * FROM Messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY sent_at ASC;
    `,[e,t,t,e])}async function $e(e){return await y("INSERT INTO Messages (sender_id, receiver_id, content, sent_at, read) VALUES (?, ?, ?, ?, ?)",[e.sender_id,e.receiver_id,e.content,e.sent_at,e.read],!1)}async function U(){const e=localStorage.getItem("authToken");if(!e)return null;const t=localStorage.getItem("user:"+e);if(t)return JSON.parse(t);const s=await q(e);if(s.success&&s.data&&s.data.length>0){console.log("User data retrieved from database:",s.data[0]);const a=O(s.data[0]);return localStorage.setItem("user:"+e,JSON.stringify(a)),a}return null}async function Se(){const e=await y("SELECT * FROM Listings WHERE is_active = '1' ORDER BY created_at DESC");return console.log("Active listings query result:",e),e.success&&e.data?{success:!0,data:e.data.map(ne)}:e}async function ke(e,t){const s=await y("INSERT INTO UserInterests (renter_id, listing_id, status, created_at) VALUES (?, ?, 'Pending', ?)",[e,t,Date.now()],!1);return X("UserInterests"),s}async function le(e){const t=await y("SELECT data FROM ListingPhotos WHERE listing_id = ?",[e]);return t.success&&t.data&&t.data.length>0?t.data[0][0]:null}async function Pe(e){const t=await y("SELECT * FROM Listings WHERE user_id = ? ORDER BY created_at DESC",[e]);return t.success&&t.data?{success:!0,data:t.data.map(ne)}:t}async function te(e){const t=await y("SELECT * FROM UserInterests WHERE listing_id = ? ORDER BY created_at DESC",[e]);return t.success&&t.data?{success:!0,data:t.data.map(ie)}:t}async function Ie(e){const t=await y("SELECT COUNT(*) FROM Messages WHERE receiver_id = ? AND read = 'False'",[e]);return t.success&&t.data&&t.data.length>0&&Number(t.data[0][0])||0}async function Te(e){const t=await y("SELECT * FROM UserInterests WHERE renter_id = ? ORDER BY created_at DESC",[e]);return t.success&&t.data?{success:!0,data:t.data.map(ie)}:t}const Ce={name:"login",render:()=>{const e=document.getElementById("app");e.innerHTML=`
            <div class="login-container">
                <h1>Roomie Match</h1>
                <form id="login-form">
                    <input type="email" id="email" placeholder="Email" required />
                    <input type="password" id="password" placeholder="Password" required />
                    <button type="submit">Login</button>
                </form>
                <button id="login-as-guest">Login as Guest</button>
            </div>
        `,document.getElementById("login-form")?.addEventListener("submit",se),document.getElementById("login-as-guest")?.addEventListener("click",()=>{oe("dsteynor0@mysql.com","$2a$04$di9TDfadKUkdFJSlZVZyhO0hDGa42Y1skGrueD9ILj.OHjtqBVI7a").then(t=>{t.success?(localStorage.setItem("authToken",String(t.data.user_id)),localStorage.setItem("user:"+t.data.user_id,JSON.stringify(t.data)),h.navigate("dashboard")):alert("Guest login failed")})})},cleanup:()=>{document.getElementById("login-form")?.removeEventListener("submit",se),document.getElementById("login-as-guest")?.removeEventListener("click",()=>{})}};async function se(e){e.preventDefault();const t=document.getElementById("email").value,s=document.getElementById("password").value;oe(t,s).then(a=>{a.success?(localStorage.setItem("authToken",String(a.data.user_id)),localStorage.setItem("user:"+a.data.user_id,JSON.stringify(a.data)),h.navigate("dashboard")):alert("Login failed")}).catch(a=>{console.error("Login error:",a),alert("An error occurred during login: "+(a instanceof Error?a.message:"Unknown error"))})}const S={getHTML:e=>`
        <header class="dashboard-header">
            <div>
                <a href="#" class="brand-link">Roomie Match</a>
            </div>
            <nav>
                <a href="#" class="nav-link" data-page="dashboard">Dashboard</a>
                <a href="#" class="nav-link" data-page="matches">Matches</a>
                <a href="#" class="nav-link" data-page="messages">Messages</a>
                <div class="profile-dropdown-container">
                    <button id="open-dropdown">
                        <img id="profile-img"></img>
                    </button>
                    <div id="profile-dropdown" class="profile-dropdown">
                        <a href="#" class="dropdown-link" data-page="profile">Profile</a>
                        <button id="dropdown-logout" class="dropdown-logout">Logout</button>
                    </div>
                </div>
            </nav>
        </header>
    `,setupListeners:(e,t)=>{const s={navClickHandler:()=>{},brandClickHandler:()=>{},logoutHandler:()=>{}};if(s.navClickHandler=n=>{n.preventDefault();const i=n.target.getAttribute("data-page");i&&h.navigate(i)},document.querySelectorAll(".nav-link").forEach(n=>n.addEventListener("click",s.navClickHandler)),s.brandClickHandler=n=>{n.preventDefault(),h.navigate("matches")},document.querySelector(".brand-link")?.addEventListener("click",s.brandClickHandler),t.showProfileDropdown){s.dropdownClickHandler=r=>{r.stopPropagation(),document.getElementById("profile-dropdown")?.classList.toggle("show")};const n=document.getElementById("open-dropdown");n&&n.addEventListener("click",s.dropdownClickHandler),s.dropdownLogoutHandler=()=>{localStorage.removeItem("authToken"),h.navigate("login")};const l=document.getElementById("dropdown-logout");l&&l.addEventListener("click",s.dropdownLogoutHandler),s.dropdownProfileHandler=r=>{r.preventDefault(),document.getElementById("profile-dropdown")?.classList.remove("show"),h.navigate("profile")};const i=document.querySelector(".dropdown-link");i&&i.addEventListener("click",s.dropdownProfileHandler),s.documentClickHandler=r=>{const p=document.getElementById("profile-dropdown"),c=document.querySelector(".profile-dropdown-container");p&&!c?.contains(r.target)&&p.classList.remove("show")},document.addEventListener("click",s.documentClickHandler),(async()=>{const r=await U();if(r){const p=await N(r.user_id),c=document.getElementById("profile-img");c&&(c.src=p||"https://via.placeholder.com/32?text=User")}})()}return e.headerState=s,s},cleanup:e=>{const t=e.headerState;t&&(document.querySelectorAll(".nav-link").forEach(s=>{s.removeEventListener("click",t.navClickHandler)}),document.querySelector(".brand-link")?.removeEventListener("click",t.brandClickHandler),document.getElementById("logout")?.removeEventListener("click",t.logoutHandler),t.dropdownClickHandler&&document.getElementById("open-dropdown")?.removeEventListener("click",t.dropdownClickHandler),t.dropdownLogoutHandler&&document.getElementById("dropdown-logout")?.removeEventListener("click",t.dropdownLogoutHandler),t.dropdownProfileHandler&&document.querySelector(".dropdown-link")?.removeEventListener("click",t.dropdownProfileHandler),t.documentClickHandler&&document.removeEventListener("click",t.documentClickHandler))}},z={name:"dashboard",render:()=>{const e=document.getElementById("app");e.innerHTML=S.getHTML({pageName:"dashboard",showProfileDropdown:!0})+`
            <div class="dashboard-content">
                <div class="dash-loading">
                    <div class="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        `,S.setupListeners(z,{pageName:"dashboard",showProfileDropdown:!0}),Me()},cleanup:()=>{S.cleanup(z)}};async function Me(){const e=document.querySelector(".dashboard-content");if(!e)return;const t=await U();if(!t){e.innerHTML='<div class="dash-empty"><div class="icon">🔒</div><p>Please log in to view your dashboard.</p></div>';return}const[s,a,o,n]=await Promise.all([N(t.user_id).catch(()=>null),Pe(t.user_id),Ie(t.user_id),Te(t.user_id)]),l=a.success&&a.data?a.data:[],i=n.success&&n.data?n.data:[],r=new Map;let p=0;l.length>0&&(await Promise.all(l.map(d=>te(d.listing_id)))).forEach((d,C)=>{const P=d.success&&d.data?d.data.length:0;r.set(l[C].listing_id,P),p+=P});const c=s?`<img class="dash-welcome-avatar" src="${s}" alt="${t.name}" />`:`<div class="dash-welcome-avatar-placeholder">${t.name.charAt(0).toUpperCase()}</div>`,m=new Date().getHours(),w=m<12?"Good morning":m<18?"Good afternoon":"Good evening",E=l.filter(f=>f.is_active==="TRUE"||f.is_active==="1").length;let v="";if(l.length>0){const f=await Promise.all(l.map(d=>le(d.listing_id).catch(()=>null)));v=`
            <h2 class="dash-section-title">🏠 My Listings</h2>
            <div class="dash-listings">
                ${l.map((d,C)=>{const P=r.get(d.listing_id)||0,M=d.is_active==="TRUE"||d.is_active==="1",g=f[C];return`
                        <div class="dash-listing-card">
                            <div class="dash-listing-thumb">${g?`<img src="${g}" alt="${d.title}" />`:"🏠"}</div>
                            <div class="dash-listing-info">
                                <div class="dash-listing-title">${d.title}</div>
                                <div class="dash-listing-meta">$${Number(d.rent_price).toLocaleString()}/mo · ${d.city}, ${d.state}</div>
                            </div>
                            <div class="dash-listing-interests">${P} interest${P!==1?"s":""}</div>
                            <span class="dash-listing-status ${M?"active":"inactive"}">${M?"Active":"Inactive"}</span>
                        </div>
                    `}).join("")}
            </div>
        `}let T="";if(p>0){const f=[];(await Promise.all(l.map(g=>te(g.listing_id)))).forEach((g,_)=>{g.success&&g.data&&g.data.forEach(H=>{f.push({interest:H,listingTitle:l[_].title})})}),f.sort((g,_)=>_.interest.created_at-g.interest.created_at);const C=f.slice(0,5),P=await Promise.all(C.map(async({interest:g})=>{try{const _=await q(g.renter_id);if(_.success&&_.data&&_.data.length>0)return O(_.data[0])}catch{}return null})),M=await Promise.all(C.map(({interest:g})=>N(g.renter_id).catch(()=>null)));T=`
            <h2 class="dash-section-title">📬 Recent Interest in Your Listings</h2>
            <div class="dash-interests">
                ${C.map(({interest:g,listingTitle:_},H)=>{const u=P[H],b=M[H];return`
                        <div class="dash-interest-row">
                            ${b?`<img class="dash-interest-avatar" src="${b}" />`:`<div class="dash-interest-avatar-placeholder">${u?.name?.charAt(0).toUpperCase()??"?"}</div>`}
                            <div class="dash-interest-text">
                                <strong>${u?.name??"Someone"}</strong> is interested in <strong>${_}</strong>
                            </div>
                            <span class="dash-interest-status ${g.status}">${g.status}</span>
                        </div>
                    `}).join("")}
            </div>
        `}let $="";i.length>0&&($=`
            <h2 class="dash-section-title">💌 Your Sent Interests</h2>
            <div class="dash-interests">
                ${i.slice(0,5).map(d=>`
                    <div class="dash-interest-row">
                        <div class="dash-interest-avatar-placeholder">📋</div>
                        <div class="dash-interest-text">
                            Listing <strong>${d.listing_id.slice(0,8)}…</strong>
                        </div>
                        <span class="dash-interest-status ${d.status}">${d.status}</span>
                    </div>
                `).join("")}
            </div>
        `),e.innerHTML=`
        <!-- Welcome -->
        <div class="dash-welcome">
            ${c}
            <div class="dash-welcome-text">
                <h1>${w}, ${t.name}!</h1>
                <p>Here's an overview of your Roomie Match activity.</p>
            </div>
        </div>

        <!-- Stats -->
        <div class="dash-stats">
            <div class="dash-stat" data-nav="matches">
                <div class="dash-stat-icon listings">🏠</div>
                <div class="dash-stat-body">
                    <span class="dash-stat-value">${E}</span>
                    <span class="dash-stat-label">Active Listings</span>
                </div>
            </div>
            <div class="dash-stat" data-nav="dashboard">
                <div class="dash-stat-icon interests">📬</div>
                <div class="dash-stat-body">
                    <span class="dash-stat-value">${p}</span>
                    <span class="dash-stat-label">Incoming Interests</span>
                </div>
            </div>
            <div class="dash-stat" data-nav="messages">
                <div class="dash-stat-icon messages">💬</div>
                <div class="dash-stat-body">
                    <span class="dash-stat-value">${o}</span>
                    <span class="dash-stat-label">Unread Messages</span>
                </div>
            </div>
            <div class="dash-stat" data-nav="matches">
                <div class="dash-stat-icon sent">💌</div>
                <div class="dash-stat-body">
                    <span class="dash-stat-value">${i.length}</span>
                    <span class="dash-stat-label">Interests Sent</span>
                </div>
            </div>
        </div>

        <!-- Quick actions -->
        <div class="dash-actions">
            <button class="dash-action-btn" data-nav="matches"><span class="icon">🔍</span> Browse Listings</button>
            <button class="dash-action-btn" data-nav="messages"><span class="icon">💬</span> Messages</button>
            <button class="dash-action-btn" data-nav="profile"><span class="icon">👤</span> Edit Profile</button>
        </div>

        <!-- My listings -->
        ${v||`
            <h2 class="dash-section-title">🏠 My Listings</h2>
            <div class="dash-empty">
                <div class="icon">📋</div>
                <p>You haven't created any listings yet.</p>
            </div>
        `}

        <!-- Incoming interests -->
        ${T}

        <!-- Sent interests -->
        ${$}
    `,e.querySelectorAll("[data-nav]").forEach(f=>{f.addEventListener("click",()=>{const d=f.dataset.nav;d&&h.navigate(d)})})}let Y=null;function A(e,t="info"){const s=document.querySelector(".match-toast");s&&s.remove();const a=document.createElement("div");a.className=`match-toast ${t}`,a.textContent=e,document.body.appendChild(a),requestAnimationFrame(()=>{a.classList.add("show")}),setTimeout(()=>{a.classList.remove("show"),setTimeout(()=>a.remove(),300)},2e3)}function He(e){try{return new Date(e).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}catch{return e}}function B(e,t){return`<span class="card-detail">${{cleanliness_level:"🧹 Cleanliness",sleep_schedule:"🌙 Sleep",pet_friendly:"🐾 Pets",smoking_allowed:"🚬 Smoking",noise_tolerance:"🔊 Noise",guests_allowed:"👥 Guests",work_schedule:"💼 Work"}[e]||e}: ${t}</span>`}function Be(e,t,s,a,o){const n=t?`<img src="${t}" alt="${e.title}" />`:"🏠",l=o?`<img src="${o}" alt="${s?.name}" class="lister-avatar" />`:`<div class="lister-avatar-placeholder">${s?.name?.charAt(0).toUpperCase()??"?"}</div>`,i=s?`
        <div class="card-lister">
            ${l}
            <div class="lister-info">
                <span class="lister-name">${s.name}</span>
                <span class="lister-meta">${s.age?s.age+" · ":""}${s.gender||""}${s.occupation?" · "+s.occupation:""}</span>
            </div>
        </div>
        ${s.bio?`<p class="lister-bio">${s.bio}</p>`:""}
    `:"",r=a?`
        <div class="card-prefs">
            ${a.cleanliness_level?B("cleanliness_level",a.cleanliness_level):""}
            ${a.sleep_schedule?B("sleep_schedule",a.sleep_schedule):""}
            ${a.pet_friendly?B("pet_friendly",a.pet_friendly):""}
            ${a.smoking_allowed?B("smoking_allowed",a.smoking_allowed):""}
            ${a.noise_tolerance?B("noise_tolerance",a.noise_tolerance):""}
            ${a.guests_allowed?B("guests_allowed",a.guests_allowed):""}
            ${a.work_schedule?B("work_schedule",a.work_schedule):""}
        </div>
    `:"";return`
        <div class="swipe-overlay like"><span class="label">INTERESTED</span></div>
        <div class="swipe-overlay nope"><span class="label">PASS</span></div>
        <div class="card-photo">${n}</div>
        <div class="card-body">
            <p class="card-price">$${Number(e.rent_price).toLocaleString()}/mo</p>
            <h2 class="card-title">${e.title}</h2>
            <div class="card-location">📍 ${e.city}, ${e.state} ${e.zip_code}</div>
            <div class="card-details">
                <span class="card-detail">🛏 ${e.num_rooms} room${Number(e.num_rooms)!==1?"s":""}</span>
                <span class="card-detail">🚿 ${e.num_bathrooms} bath${Number(e.num_bathrooms)!==1?"s":""}</span>
            </div>
            <p class="card-description">${e.description}</p>
            <p class="card-available">Available ${He(e.available_date)}</p>
            <hr class="card-divider" />
            ${i}
            ${r}
        </div>
    `}function Re(e,t,s){let a=0,o=0,n=0,l=!1,i=null,r=null;const p=100,c=15,m=e.querySelector(".card-stack"),w=e.querySelector(".action-btn.decline"),E=e.querySelector(".action-btn.interest");async function v(u,b=!1){if(u>=t.length)return null;const L=t[u],k=document.createElement("div");k.className="listing-card"+(b?" behind":""),k.dataset.index=String(u);let I=null,F=null,W=null,ee=null;try{const[ce,x,j,de]=await Promise.all([le(L.listing_id).catch(()=>null),q(L.user_id),re(L.user_id),N(L.user_id).catch(()=>null)]);I=ce,ee=de,x.success&&x.data&&x.data.length>0&&(F=O(x.data[0])),j.success&&j.data&&j.data.length>0&&(W=ae(j.data[0]))}catch{}return k.innerHTML=Be(L,I,F,W,ee),b?m.prepend(k):m.appendChild(k),k}async function T(){m.innerHTML="",a+1<t.length&&(r=await v(a+1,!0)),a<t.length?(i=await v(a),f(i)):$()}function $(){m.innerHTML="";const u=document.createElement("div");u.className="matches-empty",u.innerHTML=`
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p>No more listings to show</p>
            <p style="font-size:0.9rem; margin-top:0.5rem;">Check back later for new listings!</p>
        `,m.appendChild(u);const b=e.querySelector(".card-actions");b&&(b.style.display="none")}function f(u){u.addEventListener("pointerdown",d),u.addEventListener("pointermove",C),u.addEventListener("pointerup",P),u.addEventListener("pointercancel",P)}function d(u){i&&(l=!0,o=u.clientX,u.clientY,n=0,i.classList.add("dragging"),i.setPointerCapture(u.pointerId))}function C(u){if(!l||!i)return;n=u.clientX-o;const b=n/window.innerWidth*c;i.style.transform=`translateX(${n}px) rotate(${b}deg)`;const L=i.querySelector(".swipe-overlay.like"),k=i.querySelector(".swipe-overlay.nope"),I=Math.min(Math.abs(n)/p,1);if(n>0?(L.style.opacity=String(I),k.style.opacity="0"):(k.style.opacity=String(I),L.style.opacity="0"),r){const F=.95+.05*Math.min(I,1),W=12-12*Math.min(I,1);r.style.transform=`scale(${F}) translateY(${W}px)`,r.style.opacity=String(.6+.4*Math.min(I,1))}}function P(u){if(!(!l||!i))if(l=!1,i.classList.remove("dragging"),Math.abs(n)>=p){const b=n>0?"right":"left";M(b)}else{i.style.transition="transform 0.3s ease",i.style.transform="";const b=i.querySelector(".swipe-overlay.like"),L=i.querySelector(".swipe-overlay.nope");b.style.opacity="0",L.style.opacity="0",r&&(r.style.transition="transform 0.3s ease, opacity 0.3s ease",r.style.transform="scale(0.95) translateY(12px)",r.style.opacity="0.6"),setTimeout(()=>{i&&(i.style.transition=""),r&&(r.style.transition="")},300)}}async function M(u){if(!i)return;const b=t[a],L=u==="right"?window.innerWidth:-window.innerWidth,k=u==="right"?30:-30;if(i.classList.add("animate-out"),i.style.transform=`translateX(${L}px) rotate(${k}deg)`,i.style.opacity="0",r&&(r.style.transition="transform 0.3s ease, opacity 0.3s ease",r.classList.remove("behind"),r.style.transform="",r.style.opacity="1"),u==="right")try{await ke(s,b.listing_id),A("Interest sent! 🎉","success")}catch{A("Failed to send interest","error")}else A("Passed","info");await new Promise(I=>setTimeout(I,400)),i.remove(),a++,i=r,i&&(i.style.transition="",f(i)),r=null,a+1<t.length&&(r=await v(a+1,!0)),a>=t.length&&$()}function g(){i&&!l&&M("left")}function _(){i&&!l&&M("right")}w?.addEventListener("click",g),E?.addEventListener("click",_);function H(u){u.key==="ArrowLeft"&&g(),u.key==="ArrowRight"&&_()}return document.addEventListener("keydown",H),T(),()=>{w?.removeEventListener("click",g),E?.removeEventListener("click",_),document.removeEventListener("keydown",H)}}const K={name:"matches",render:()=>{const e=document.getElementById("app");e.innerHTML=S.getHTML({pageName:"matches",showProfileDropdown:!0})+`
            <div class="matches-content">
                <div class="card-stack">
                    <div class="matches-loading">
                        <div class="spinner"></div>
                        <p>Loading listings...</p>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="action-btn decline" title="Pass (← arrow key)">✕</button>
                    <button class="action-btn interest" title="Interested (→ arrow key)">♥</button>
                </div>
            </div>
        `,S.setupListeners(K,{pageName:"matches",showProfileDropdown:!0}),Promise.all([U(),Se()]).then(([t,s])=>{if(!t){A("Please log in first","error");return}if(!s.success||!s.data||s.data.length===0){const n=document.querySelector(".card-stack");n&&(n.innerHTML=`
                        <div class="matches-empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <p>No listings available yet</p>
                        </div>
                    `);const l=document.querySelector(".card-actions");l&&(l.style.display="none");return}const a=s.data.filter(n=>n.user_id!==t.user_id);if(a.length===0){const n=document.querySelector(".card-stack");n&&(n.innerHTML=`
                        <div class="matches-empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <p>No more listings to show</p>
                        </div>
                    `);const l=document.querySelector(".card-actions");l&&(l.style.display="none");return}const o=document.querySelector(".matches-content");Y=Re(o,a,t.user_id)}).catch(t=>{console.error("Error loading matches:",t),A("Error loading listings","error")})},cleanup:()=>{Y&&(Y(),Y=null),S.cleanup(K);const e=document.querySelector(".match-toast");e&&e.remove()}};function R(e,t="success"){const s=document.querySelector(".profile-toast");s&&s.remove();const a=document.createElement("div");a.className=`profile-toast ${t}`,a.textContent=e,document.body.appendChild(a),requestAnimationFrame(()=>a.classList.add("show")),setTimeout(()=>{a.classList.remove("show"),setTimeout(()=>a.remove(),300)},2e3)}const G={cleanliness_level:{label:"Cleanliness",icon:"🧹",options:["Low","Medium","High"]},sleep_schedule:{label:"Sleep Schedule",icon:"🌙",options:["Early Bird","Night Owl","Flexible"]},pet_friendly:{label:"Pet Friendly",icon:"🐾",options:["Yes","No"]},smoking_allowed:{label:"Smoking",icon:"🚬",options:["Yes","No"]},noise_tolerance:{label:"Noise Tolerance",icon:"🔊",options:["Low","Medium","High"]},guests_allowed:{label:"Guests Allowed",icon:"👥",options:["Rarely","Sometimes","Often"]},work_schedule:{label:"Work Schedule",icon:"💼",options:["Remote","Hybrid","In-Office","Other"]}};function De(e,t,s){const a=t?`<img class="profile-avatar" src="${t}" alt="${e.name}" />`:`<div class="profile-avatar-placeholder">${e.name.charAt(0).toUpperCase()}</div>`,o=Object.keys(G);return`
        <!-- Profile Card -->
        <div class="profile-card">
            <div class="profile-avatar-wrap">
                ${a}
                <label class="profile-avatar-edit" title="Change photo">
                    📷
                    <input type="file" id="photo-upload" accept="image/*" />
                </label>
            </div>
            <h1 class="profile-name">${e.name}</h1>
            <p class="profile-meta">${e.age?e.age+" · ":""}${e.gender||""}${e.occupation?" · "+e.occupation:""}</p>
            ${e.bio?`<p class="profile-bio">${e.bio}</p>`:""}
            <p class="profile-email">${e.email}</p>
        </div>

        <!-- Personal Info -->
        <div class="profile-section">
            <div class="profile-section-header">
                <h2 class="profile-section-title">👤 Personal Info</h2>
                <button class="profile-edit-btn" id="edit-info-btn">Edit</button>
            </div>
            <div class="profile-info-grid" id="info-display">
                <div class="profile-info-item">
                    <span class="profile-info-label">Name</span>
                    <span class="profile-info-value">${e.name||"—"}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Email</span>
                    <span class="profile-info-value">${e.email||"—"}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Age</span>
                    <span class="profile-info-value">${e.age||"—"}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Gender</span>
                    <span class="profile-info-value">${e.gender||"—"}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Occupation</span>
                    <span class="profile-info-value">${e.occupation||"—"}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Member Since</span>
                    <span class="profile-info-value">${e.created_at?new Date(e.created_at).toLocaleDateString():"—"}</span>
                </div>
            </div>
            <div id="info-edit" style="display:none;">
                <div class="profile-form-grid">
                    <div class="profile-form-group">
                        <label class="profile-form-label">Name</label>
                        <input class="profile-form-input" id="edit-name" value="${e.name||""}" />
                    </div>
                    <div class="profile-form-group">
                        <label class="profile-form-label">Email</label>
                        <input class="profile-form-input" id="edit-email" type="email" value="${e.email||""}" />
                    </div>
                    <div class="profile-form-group">
                        <label class="profile-form-label">Age</label>
                        <input class="profile-form-input" id="edit-age" type="number" value="${e.age||""}" />
                    </div>
                    <div class="profile-form-group">
                        <label class="profile-form-label">Gender</label>
                        <select class="profile-form-select" id="edit-gender">
                            <option value="">Select</option>
                            ${["Male","Female","Non-binary","Other"].map(n=>`<option value="${n}" ${e.gender===n?"selected":""}>${n}</option>`).join("")}
                        </select>
                    </div>
                    <div class="profile-form-group">
                        <label class="profile-form-label">Occupation</label>
                        <input class="profile-form-input" id="edit-occupation" value="${e.occupation||""}" />
                    </div>
                    <div class="profile-form-group full-width">
                        <label class="profile-form-label">Bio</label>
                        <textarea class="profile-form-textarea" id="edit-bio">${e.bio||""}</textarea>
                    </div>
                </div>
                <div class="profile-btn-row">
                    <button class="profile-edit-btn cancel" id="cancel-info-btn">Cancel</button>
                    <button class="profile-edit-btn save" id="save-info-btn">Save Changes</button>
                </div>
            </div>
        </div>

        <!-- Preferences -->
        <div class="profile-section">
            <div class="profile-section-header">
                <h2 class="profile-section-title">⚙️ Living Preferences</h2>
                <button class="profile-edit-btn" id="edit-prefs-btn">Edit</button>
            </div>
            <div class="profile-prefs-grid" id="prefs-display">
                ${o.map(n=>{const l=G[n],i=s?s[n]:"";return`
                        <div class="profile-pref-item">
                            <span class="profile-pref-label">${l.icon} ${l.label}</span>
                            <span class="profile-pref-value">${i||"—"}</span>
                        </div>
                    `}).join("")}
            </div>
            <div id="prefs-edit" style="display:none;">
                <div class="profile-form-grid">
                    ${o.map(n=>{const l=G[n],i=s?s[n]:"";return`
                            <div class="profile-form-group">
                                <label class="profile-form-label">${l.icon} ${l.label}</label>
                                <select class="profile-form-select" id="edit-pref-${n}">
                                    <option value="">Select</option>
                                    ${l.options.map(r=>`<option value="${r}" ${i===r?"selected":""}>${r}</option>`).join("")}
                                </select>
                            </div>
                        `}).join("")}
                </div>
                <div class="profile-btn-row">
                    <button class="profile-edit-btn cancel" id="cancel-prefs-btn">Cancel</button>
                    <button class="profile-edit-btn save" id="save-prefs-btn">Save Preferences</button>
                </div>
            </div>
        </div>
    `}async function Q(){const e=document.querySelector(".profile-content");if(!e)return;const t=await U();if(!t){e.innerHTML='<div class="profile-loading"><p>Please log in to view your profile.</p></div>';return}const[s,a]=await Promise.all([N(t.user_id).catch(()=>null),re(t.user_id)]);let o=null;a.success&&a.data&&a.data.length>0&&(o=ae(a.data[0])),e.innerHTML=De(t,s,o),Oe(t)}function Oe(e,t){const s=document.getElementById("photo-upload");s?.addEventListener("change",async()=>{const E=s.files?.[0];if(!E)return;const v=new FileReader;v.onload=async()=>{const T=v.result;try{await we(e.user_id,T);const $=document.querySelector(".profile-avatar-wrap");if($){const f=$.querySelector(".profile-avatar, .profile-avatar-placeholder");if(f){const d=document.createElement("img");d.className="profile-avatar",d.src=T,d.alt=e.name,f.replaceWith(d)}}R("Photo updated!")}catch{R("Failed to update photo","error")}},v.readAsDataURL(E)});const a=document.getElementById("edit-info-btn"),o=document.getElementById("info-display"),n=document.getElementById("info-edit"),l=document.getElementById("cancel-info-btn"),i=document.getElementById("save-info-btn");a?.addEventListener("click",()=>{o&&(o.style.display="none"),n&&(n.style.display="block"),a&&(a.style.display="none")}),l?.addEventListener("click",()=>{o&&(o.style.display=""),n&&(n.style.display="none"),a&&(a.style.display="")}),i?.addEventListener("click",async()=>{const E={name:document.getElementById("edit-name")?.value||"",email:document.getElementById("edit-email")?.value||"",age:document.getElementById("edit-age")?.value||"",gender:document.getElementById("edit-gender")?.value||"",occupation:document.getElementById("edit-occupation")?.value||"",bio:document.getElementById("edit-bio")?.value||""};try{await be(e.user_id,E),R("Profile updated!"),await Q()}catch{R("Failed to update profile","error")}});const r=document.getElementById("edit-prefs-btn"),p=document.getElementById("prefs-display"),c=document.getElementById("prefs-edit"),m=document.getElementById("cancel-prefs-btn"),w=document.getElementById("save-prefs-btn");r?.addEventListener("click",()=>{p&&(p.style.display="none"),c&&(c.style.display="block"),r&&(r.style.display="none")}),m?.addEventListener("click",()=>{p&&(p.style.display=""),c&&(c.style.display="none"),r&&(r.style.display="")}),w?.addEventListener("click",async()=>{const E={};for(const v of Object.keys(G))E[v]=document.getElementById(`edit-pref-${v}`)?.value||"";try{await Ee(e.user_id,E),R("Preferences updated!"),await Q()}catch{R("Failed to update preferences","error")}})}const V={name:"profile",render:()=>{const e=document.getElementById("app");e.innerHTML=S.getHTML({pageName:"profile",showProfileDropdown:!1})+`
            <div class="profile-content">
                <div class="profile-loading">
                    <div class="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        `,S.setupListeners(V,{pageName:"profile",showProfileDropdown:!1}),Q()},cleanup:()=>{S.cleanup(V);const e=document.querySelector(".profile-toast");e&&e.remove()}},Ne={name:"notfound",render:()=>{const e=document.getElementById("app");e.innerHTML=`
            <div class="notfound-container">
                <h1>404</h1>
                <p>Page not found</p>
                <p>Redirecting to dashboard...</p>
            </div>
        `,setTimeout(()=>{h.navigate("dashboard")},2e3)},cleanup:()=>{}},Z={name:"messages",render:()=>{const e=document.getElementById("app");e.innerHTML=S.getHTML({pageName:"messages",showProfileDropdown:!0})+`
            <div class="messages-container">
                <div class="messages-sidebar">
                    <h2>Conversations</h2>
                    <p>Loading conversations...</p>
                </div>
                <div class="messages-content">
                <p>Select a conversation to view messages</p>
            </div>
        `;const t=async n=>{const l=document.querySelector(".messages-content"),i=await U(),r=await q(n);if(console.log(n,r),!i){l.innerHTML="<p>Please log in to view messages.</p>";return}if(!r.success||!r.data||r.data.length===0){l.innerHTML="<p>Something went wrong.</p>";return}const p=O(r.data[0]),c=await Le(n,i.user_id);if(console.log("Chat messages result:",c),c.success&&c.data){const m=c.data.map(w=>me(w));s(l,i,m,p)}},s=(n,l,i,r)=>{document.getElementById("send-message-button")?.removeEventListener("click",()=>{}),document.getElementById("message-input-field")?.removeEventListener("keypress",()=>{});const p=i.map(c=>`
                        <div class="message-container">
                            <div class="message ${c.sender_id===l.user_id?"sent":"received"}">
                                <p>${c.content}</p>
                            </div>
                            <span class="timestamp">${new Date(c.sent_at).toLocaleString()}</span>
                        </div>
                    `).join("");n.innerHTML=`
                    <div class="conversation-header">
                        <h2>${r.name}</h2>
                    </div>
                    <div class="messages-list">
                        ${p}
                    </div>
                    <div class="message-input">
                        <input type="text" placeholder="Type your message..." id="message-input-field">
                        <button id="send-message-button">Send</button>
                    </div>
                `,document.getElementById("send-message-button")?.addEventListener("click",c=>o(c,l,r)),document.getElementById("message-input-field")?.addEventListener("keypress",c=>{c.key==="Enter"&&o(c,l,r)})};(async()=>{const n=await U();if(!n)return;const l=n.user_id,i=await _e(l);if(i.success){if(!i.data||i.data.length===0){const c=document.querySelector(".messages-sidebar");c.innerHTML=`
                        <h2>Conversations</h2>
                        <p>No conversations yet, start matching to begin chatting!</p>
                    `;return}var r=i.data.filter(([c,m])=>c!==l).map(async([c,m])=>{const w=await q(c);if(w.success&&w.data&&w.data.length>0){const E=O(w.data[0]),v=await N(c);return{userId:c,count:m,name:E.name,avatar:v}}else return{userId:c,count:m,name:"Unknown User",avatar:null}});const p=document.querySelector(".messages-sidebar");p.innerHTML='<h2 class="sidebar-title">Conversations</h2>',r.forEach(c=>{c.then(({userId:m,count:w,name:E,avatar:v})=>{const T=`
                            <div class="chat-item" id="chat-item-${m}">
                                <img src="${v}" alt="User Avatar" class="avatar">
                                <div class="conversation-info">
                                    <h3>${E}</h3>
                                    <div class="notif">${w}</div>
                                </div>
                            </div>
                        `;p.insertAdjacentHTML("beforeend",T);const $=document.getElementById(`chat-item-${m}`);$&&$.addEventListener("click",()=>{console.log("Clicked chat with userId:",m),p.querySelectorAll(".chat-item").forEach(f=>{f.classList.remove("active")}),$.classList.add("active"),t(m)})})})}else console.error("Failed to fetch user chats:",i.error)})();const o=async(n,l,i)=>{n.preventDefault();const r=document.getElementById("message-input-field");if(r.value.trim()==="")return;const p=r.value.trim();p&&(console.log("Message to send:",p),r.value=""),$e({sender_id:l.user_id,receiver_id:i.user_id,content:p,sent_at:new Date().toISOString(),read:"False"}),await t(i.user_id)};S.setupListeners(Z,{pageName:"messages",showProfileDropdown:!0})},cleanup:()=>{S.cleanup(Z),document.getElementById("send-message-button")?.removeEventListener("click",()=>{})}};h.register(Ce);h.register(z);h.register(K);h.register(Z);h.register(V);h.register(Ne);window.addEventListener("popstate",e=>{const t=e.state?.page||"login";h.navigate(t)});const Ue=()=>{const s=window.location.pathname.split("/").filter(Boolean)[0]||"";return["login","dashboard","matches","messages","profile"].includes(s)?s:localStorage.getItem("authToken")?"dashboard":"login"},Ae=localStorage.getItem("authToken"),J=Ue();!Ae&&J!=="login"&&J!=="notfound"?h.navigate("login"):h.navigate(J);
