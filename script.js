/* ==========================================================
   CONFIGURACIÓN Y VARIABLES GLOBALES
   ========================================================== */
let isAdmin = sessionStorage.getItem('portfolio_admin') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    aplicarModoAdminVisual();
    cargarDatosLocales();
    renderProjectsFromStorage();
    renderHobbiesFromStorage();
});

/* ==========================================================
   NAVEGACIÓN ENTRE VISTAS
   ========================================================== */
function switchView(viewId, btn) {
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
    });

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }
    if (btn) {
        btn.classList.add('active');
    }
}

/* ==========================================================
   GESTIÓN DE ADMINISTRADOR (Contraseña: bryan2026)
   ========================================================== */
function verificarAdmin() {
    if (isAdmin) {
        if (confirm('¿Deseas cerrar sesión de Administrador?')) {
            sessionStorage.removeItem('portfolio_admin');
            isAdmin = false;
            location.reload();
        }
        return;
    }
    const pass = prompt('Ingrese la contraseña de Administrador:');
    if (pass === 'bryan2026') {
        sessionStorage.setItem('portfolio_admin', 'true');
        isAdmin = true;
        location.reload();
    } else if (pass !== null) {
        alert('Contraseña incorrecta.');
    }
}

function aplicarModoAdminVisual() {
    // Si quieres ocultar o mostrar los botones de editar según el rol
    const editBtns = document.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
        btn.style.display = isAdmin ? 'inline-block' : 'none';
    });
}

/* ==========================================================
   EDICIÓN EN LÍNEA (SECCIONES: Perfil, Skills, Eventos, Certs, Contacto)
   ========================================================== */
function toggleEdit(sectionKey) {
    if (!isAdmin) { 
        verificarAdmin(); 
        return; 
    }
    
    const editBox = document.getElementById('edit-box-' + sectionKey);
    if (!editBox) return;

    const isActive = editBox.classList.contains('active');

    if (!isActive) {
        // Cargar datos actuales en los inputs al abrir el editor
        if (sectionKey === 'profile') {
            const disp = document.getElementById('disp-profile');
            const input = document.getElementById('input-profile');
            if (disp && input) input.value = disp.innerText.trim();
        } 
        else if (sectionKey === 'skills') {
            const disp = document.getElementById('disp-skills-container');
            const input = document.getElementById('input-skills');
            if (disp && input) input.value = disp.innerHTML.trim();
        } 
        else if (sectionKey === 'events') {
            const disp = document.getElementById('disp-events-intro');
            const input = document.getElementById('input-events');
            if (disp && input) input.value = disp.innerHTML.trim();
        } 
        else if (sectionKey === 'certs') {
            const disp = document.getElementById('disp-certs');
            const input = document.getElementById('input-certs');
            if (disp && input) input.value = disp.innerHTML.trim();
        } 
        else if (sectionKey === 'contact') {
            // Cargar campos de contacto y servicios
            setVal('input-srv1-title', getTxt('disp-srv1-title'));
            setVal('input-srv1-desc', getTxt('disp-srv1-desc'));
            setVal('input-srv2-title', getTxt('disp-srv2-title'));
            setVal('input-srv2-desc', getTxt('disp-srv2-desc'));
            setVal('input-phone', getTxt('disp-phone'));
            setValAttr('input-wsp', 'disp-wsp-link', 'href');
            setValAttr('input-fb', 'disp-fb-link', 'href');
            setValAttr('input-tk', 'disp-tk-link', 'href');
        }
    }
    editBox.classList.toggle('active');
}

function saveEdit(sectionKey) {
    if (!isAdmin) { alert('Acción no permitida'); return; }
    let savedData = JSON.parse(localStorage.getItem('portfolio_edits')) || {};

    if (sectionKey === 'contact') {
        const data = {
            srv1Title: getVal('input-srv1-title'),
            srv1Desc: getVal('input-srv1-desc'),
            srv2Title: getVal('input-srv2-title'),
            srv2Desc: getVal('input-srv2-desc'),
            phone: getVal('input-phone'),
            wsp: getVal('input-wsp'),
            fb: getVal('input-fb'),
            tk: getVal('input-tk')
        };
        savedData['contact'] = data;
        localStorage.setItem('portfolio_edits', JSON.stringify(savedData));
        aplicarDatosContacto(data);
    } else {
        const inputId = 'input-' + sectionKey;
        const dispId = sectionKey === 'skills' ? 'disp-skills-container' : 
                       sectionKey === 'profile' ? 'disp-profile' :
                       sectionKey === 'events' ? 'disp-events-intro' : 'disp-certs';
        
        const inputEl = document.getElementById(inputId);
        const dispEl = document.getElementById(dispId);

        if (inputEl && dispEl) {
            const val = inputEl.value;
            if (sectionKey === 'skills' || sectionKey === 'certs' || sectionKey === 'events') {
                dispEl.innerHTML = val;
            } else {
                dispEl.innerText = val;
            }
            savedData[sectionKey] = val;
            localStorage.setItem('portfolio_edits', JSON.stringify(savedData));
        }
    }
    toggleEdit(sectionKey);
}

function cargarDatosLocales() {
    const savedData = JSON.parse(localStorage.getItem('portfolio_edits')) || {};

    if (savedData['profile']) {
        const el = document.getElementById('disp-profile');
        if (el) el.innerText = savedData['profile'];
    }
    if (savedData['skills']) {
        const el = document.getElementById('disp-skills-container');
        if (el) el.innerHTML = savedData['skills'];
    }
    if (savedData['events']) {
        const el = document.getElementById('disp-events-intro');
        if (el) el.innerHTML = savedData['events'];
    }
    if (savedData['certs']) {
        const el = document.getElementById('disp-certs');
        if (el) el.innerHTML = savedData['certs'];
    }
    if (savedData['contact']) {
        aplicarDatosContacto(savedData['contact']);
    }
}

function aplicarDatosContacto(data) {
    setTxt('disp-srv1-title', data.srv1Title);
    setTxt('disp-srv1-desc', data.srv1Desc);
    setTxt('disp-srv2-title', data.srv2Title);
    setTxt('disp-srv2-desc', data.srv2Desc);
    setTxt('disp-phone', data.phone);
    setAttr('disp-wsp-link', 'href', data.wsp);
    setAttr('disp-fb-link', 'href', data.fb);
    setAttr('disp-tk-link', 'href', data.tk);
}

/* Helpers de utilidad para el DOM */
function getTxt(id) { const el = document.getElementById(id); return el ? el.innerText : ''; }
function setTxt(id, val) { const el = document.getElementById(id); if(el) el.innerText = val; }
function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, val) { const el = document.getElementById(id); if(el) el.value = val; }
function setAttr(id, attr, val) { const el = document.getElementById(id); if(el) el.setAttribute(attr, val); }
function setValAttr(inputId, dispId, attr) {
    const dispEl = document.getElementById(dispId);
    const inputEl = document.getElementById(inputId);
    if(dispEl && inputEl) inputEl.value = dispEl.getAttribute(attr) || '';
}

/* ==========================================================
   AVATAR Y FOTO DE PERFIL
   ========================================================== */
function updateAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const wrapper = document.getElementById('avatar-display-wrapper');
            wrapper.innerHTML = `<img src="${e.target.result}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            localStorage.setItem('portfolio_avatar', e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Cargar avatar guardado al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const savedAvatar = localStorage.getItem('portfolio_avatar');
    if (savedAvatar) {
        const wrapper = document.getElementById('avatar-display-wrapper');
        if (wrapper) {
            wrapper.innerHTML = `<img src="${savedAvatar}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }
    }
});

/* ==========================================================
   PROYECTOS PERSONALES Y HOBBIES (LocalStorage)
   ========================================================== */
const projectForm = document.getElementById('project-form');
if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('proj-title').value;
        const desc = document.getElementById('proj-desc').value;
        const link = document.getElementById('proj-link').value;
        const imgFile = document.getElementById('proj-img').files[0];

        if (imgFile) {
            const reader = new FileReader();
            reader.onload = function(uploadEvent) {
                const newProject = { title, desc, link, img: uploadEvent.target.result };
                let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || [];
                projects.push(newProject);
                localStorage.setItem('portfolio_projects', JSON.stringify(projects));
                renderProjectsFromStorage();
                projectForm.reset();
                alert('¡Proyecto publicado con éxito!');
            };
            reader.readAsDataURL(imgFile);
        }
    });
}

function renderProjectsFromStorage() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    const projects = JSON.parse(localStorage.getItem('portfolio_projects')) || [];
    
    if (projects.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No hay proyectos publicados aún.</p>';
        return;
    }

    container.innerHTML = projects.map((p, index) => `
        <div class="project-card" style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; overflow: hidden; padding: 1rem; margin-bottom: 1rem;">
            ${p.img ? `<img src="${p.img}" alt="${p.title}" style="width:100%; height:160px; object-fit:cover; border-radius:6px; margin-bottom: 0.75rem;">` : ''}
            <h3 style="color: var(--accent); margin-bottom: 0.5rem;">${p.title}</h3>
            <p style="font-size: 0.9rem; margin-bottom: 0.75rem;">${p.desc}</p>
            ${p.link ? `<a href="${p.link}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-size: 0.85rem;">Ver Enlace</a>` : ''}
            ${isAdmin ? `<button onclick="deleteProject(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 10px; display: block;">Eliminar</button>` : ''}
        </div>
    `).join('');
}

function deleteProject(index) {
    if (!isAdmin) return;
    let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || [];
    projects.splice(index, 1);
    localStorage.setItem('portfolio_projects', JSON.stringify(projects));
    renderProjectsFromStorage();
}

/* Manejo de Hobbies / Carrusel */
const hobbyForm = document.getElementById('hobby-form');
if (hobbyForm) {
    hobbyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('hobby-category').value;
        const title = document.getElementById('hobby-title').value;
        const desc = document.getElementById('hobby-desc').value;
        const mediaFile = document.getElementById('hobby-media').files[0];

        if (mediaFile) {
            const reader = new FileReader();
            reader.onload = function(uploadEvent) {
                const newHobby = { category, title, desc, media: uploadEvent.target.result, type: mediaFile.type.startsWith('video') ? 'video' : 'image' };
                let hobbies = JSON.parse(localStorage.getItem('portfolio_hobbies')) || [];
                hobbies.push(newHobby);
                localStorage.setItem('portfolio_hobbies', JSON.stringify(hobbies));
                renderHobbiesFromStorage();
                hobbyForm.reset();
                alert('¡Hobby agregado al carrusel!');
            };
            reader.readAsDataURL(mediaFile);
        }
    });
}

function renderHobbiesFromStorage() {
    const container = document.getElementById('carousel-container');
    if (!container) return;
    const hobbies = JSON.parse(localStorage.getItem('portfolio_hobbies')) || [];

    if (hobbies.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No hay elementos en el carrusel.</p>';
        return;
    }

    container.innerHTML = hobbies.map((h, index) => `
        <div class="carousel-item" style="min-width: 280px; background: rgba(30, 41, 59, 0.8); border-radius: 8px; padding: 1rem; border: 1px solid rgba(255,255,255,0.05); position: relative;">
            <span style="font-size: 0.75rem; background: var(--accent); color: #0f172a; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${h.category}</span>
            <h3 style="margin: 0.5rem 0; color: #fff;">${h.title}</h3>
            ${h.type === 'video' ? 
                `<video src="${h.media}" controls style="width:100%; height:140px; object-fit:cover; border-radius:6px;"></video>` : 
                `<img src="${h.media}" alt="${h.title}" style="width:100%; height:140px; object-fit:cover; border-radius:6px;">`
            }
            <p style="font-size: 0.85rem; margin-top: 0.5rem;">${h.desc}</p>
            ${isAdmin ? `<button onclick="deleteHobby(${index})" style="background: #ef4444; color: white; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer; margin-top: 8px; font-size: 0.8rem;">Eliminar</button>` : ''}
        </div>
    `).join('');
}

function deleteHobby(index) {
    if (!isAdmin) return;
    let hobbies = JSON.parse(localStorage.getItem('portfolio_hobbies')) || [];
    hobbies.splice(index, 1);
    localStorage.setItem('portfolio_hobbies', JSON.stringify(hobbies));
    renderHobbiesFromStorage();
}
