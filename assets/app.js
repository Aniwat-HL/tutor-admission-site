# --- FILE: assets/app.js
// เปลี่ยนโลโก้และธีมได้จาก CSS variables และไฟล์ svg
// Page fade-out before navigation
(function(){
document.addEventListener('click', function(e){
const a = e.target.closest('a');
if(!a) return;
const href = a.getAttribute('href');
if(!href || href.startsWith('#') || a.target==='_blank') return;
// internal link only
if(location.origin === new URL(href, location.href).origin){
e.preventDefault();
document.body.classList.add('leaving');
setTimeout(()=>{ location.href = href; }, 200);
}
});
})();


// Set active menu by pathname
(function(){
const path = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.menu a').forEach(a=>{
const href = a.getAttribute('href');
if((path === 'index.html' && href === 'index.html') || path === href){
a.classList.add('active');
}
});
})();
