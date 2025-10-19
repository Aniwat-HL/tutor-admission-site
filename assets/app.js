// Page fade-out before navigation
(function(){
  document.addEventListener('click', function(e){
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href.startsWith('#') || a.target==='_blank') return;
    // internal only
    if(location.origin === new URL(href, location.href).origin){
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(()=>{ location.href = href; }, 200);
    }
  });
})();

// Active menu by pathname
(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu a').forEach(a=>{
    const href = a.getAttribute('href');
    if((path === 'index.html' && href === 'index.html') || path === href){
      a.classList.add('active');
    }
  });
})();

// ---- Google Sheet status loader (status.html) ----
async function loadStatusFromSheet(){
  const table = document.getElementById('status-table');
  if(!table) return;
  const tbody = table.querySelector('tbody');
  const info = document.getElementById('status-info');

  // ใส่ค่าจริงของคุณ
  const SHEET_ID = '2PACX-1vQh-7Ysrk4FdoKqSWKNgQ-S9cBRGDN47crK51I9LGmjJf0dW6R00BU6P3IsKA2fuCVLP16qLxwMJZgj';
  const GID = '2051869754'; // <— ใช้ gid ของแท็บที่ publish จริง

  // ใช้ URL ให้ตรงชนิดของ ID
  const csvUrl = SHEET_ID.startsWith('2PACX-')
    ? `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${GID}&single=true&output=csv`
    : `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

  try{
    const res = await fetch(csvUrl, { cache: 'no-store' });
    if(!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const csv = await res.text();
    const rows = parseCSV(csv);

    // header ที่คาดหวัง:
    // application_id, name, course, paid, status, updated_at
    const header = rows.shift().map(h=>h.trim().toLowerCase());
    const need = ["application_id","name","course","paid","status","updated_at"];
    const ok = need.every((k,i)=> (header[i]||"") === k);
    if(!ok) throw new Error(`bad header: got [${header.join(", ")}]`);

    tbody.innerHTML = '';
    for(const r of rows){
      if(!r.length || !r[0]) continue; // ต้องมี application_id
      const [id,name,course,paid,status,updated] = r;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${escapeHtml(id)}</code></td>
        <td>${escapeHtml(name||'')}</td>
        <td>${escapeHtml(course||'')}</td>
        <td>${escapeHtml(paid||'')}</td>
        <td>${statusPill(String(status||'').toLowerCase())}</td>
        <td class="mono">${escapeHtml(updated||'')}</td>
      `;
      tbody.appendChild(tr);
    }
    info.textContent = 'อัปเดตอัตโนมัติจาก Google Sheet (อ่านอย่างเดียว)';
  }catch(err){
    console.error('Load status failed', err, csvUrl);
    info.textContent = 'โหลดสถานะไม่สำเร็จ: ตรวจสอบ Publish to the web และค่า SHEET_ID/GID';
  }
}


function statusPill(s){
  if(s.includes('approved')||s.includes('confirmed')||s.includes('paid')) return `<span class="status-pill ok">✔ ยืนยันแล้ว</span>`;
  if(s.includes('pending')||s.includes('review')) return `<span class="status-pill warn">⌛ รอตรวจสอบ</span>`;
  if(s.includes('rejected')||s.includes('cancel')) return `<span class="status-pill danger">✖ ไม่ผ่าน</span>`;
  return `<span class="status-pill">${escapeHtml(s||'-')}</span>`;
}

function escapeHtml(s){
  return String(s).replace(/[&<>\"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
}

// simple CSV parser (พอสำหรับ Google Sheet ปกติ)
function parseCSV(text){
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  for(let i=0;i<text.length;i++){
    const ch = text[i];
    if(ch === '"'){
      if(inQuotes && text[i+1]==='"'){ cell += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if(ch === ',' && !inQuotes){
      row.push(cell); cell = '';
    } else if((ch === '\n' || ch === '\r') && !inQuotes){
      if(cell !== '' || row.length) { row.push(cell); rows.push(row); row = []; cell = ''; }
    } else {
      cell += ch;
    }
  }
  if(cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

if(document.readyState !== 'loading') loadStatusFromSheet();
else document.addEventListener('DOMContentLoaded', loadStatusFromSheet);
