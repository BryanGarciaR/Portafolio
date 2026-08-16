/* ==========================================================
   CONFIGURACIÓN DE FIREBASE Y CLOUDINARY
   ========================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyDx_gaDRKRWcXbykR0w9K6T-XdvQ6mumIk",
    authDomain: "bryangr-dev.firebaseapp.com",
    projectId: "bryangr-dev",
    storageBucket: "bryangr-dev.firebasestorage.app",
    messagingSenderId: "505846189271",
    appId: "505846189271:web:dafffb1c5d6a3b33a7b492"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Credenciales Cloudinary & Admin
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/n4ni5wxl/upload";
const CLOUDINARY_PRESET = "portafolio_preset";
const ADMIN_PASSWORD = "bryan2026";

let isAdmin = sessionStorage.getItem('portfolio_admin') === 'true';

/* ==========================================================
   INICIALIZACIÓN DE LA PÁGINA
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
    syncAdminState(isAdmin);
    cargarDatosRemotos();
    cargarProyectosFirestore();
    cargarHobbiesFirestore();

    // Evento para abrir el selector de avatar al hacer clic (bloqueado si no es admin)
    const avatarContainer = document.querySelector('.avatar-container');
    const avatarInput = document.getElementById('avatar-input'); 

    if (avatarContainer && avatarInput) {
        avatarContainer.addEventListener('click', (e) => {
            if (!isAdmin) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            avatarInput.click();
        });
    }
});

/* ==========================================================
   GESTIÓN Y SINCRONIZACIÓN DEL MODO ADMINISTRADOR
   ========================================================== */
function syncAdminState(enabled) {
    isAdmin = enabled;
    sessionStorage.setItem('portfolio_admin', enabled ? 'true' : 'false');

    const toggleBtn = document.getElementById('adminToggleBtn');
    if (enabled) {
        document.body.classList.add('admin-mode');
        if (toggleBtn) toggleBtn.innerHTML = "🔓 Salir Admin";
    } else {
        document.body.classList.remove('admin-mode');
        if (toggleBtn) toggleBtn.innerHTML = "🔒 Modo Admin";
    }

    // 1. Actualizar visibilidad de botones de edición (Lápiz)
    const editBtns = document.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
        btn.style.display = enabled ? 'inline-block' : 'none';
    });

    // 2. Ocultar/Mostrar el icono de la cámara en el avatar
    const avatarOverlay = document.querySelector('.avatar-overlay');
    if (avatarOverlay) {
        avatarOverlay.style.display = enabled ? 'flex' : 'none';
    }
    
    // Cambiar el cursor para que no parezca clickeable si no eres admin
    const avatarContainer = document.querySelector('.avatar-container');
    if (avatarContainer) {
        avatarContainer.style.cursor = enabled ? 'pointer' : 'default';
    }
}

function toggleAdminMode() {
    if (isAdmin) {
        if (confirm('¿Deseas cerrar la sesión de Administrador?')) {
            syncAdminState(false);
            alert("Se ha cerrado el modo administrador.");
            cargarProyectosFirestore();
            cargarHobbiesFirestore();
        }
    } else {
        const pass = prompt("Ingrese la contraseña de administrador:");
        if (pass === ADMIN_PASSWORD) {
            syncAdminState(true);
            alert("¡Modo administrador activado con éxito!");
            cargarProyectosFirestore();
            cargarHobbiesFirestore();
        } else if (pass !== null) {
            alert("Contraseña incorrecta.");
        }
    }
}

function verificarAdmin() {
    if (!isAdmin) {
        toggleAdminMode();
    }
}

/* ==========================================================
   NAVEGACIÓN ENTRE VISTAS
   ========================================================== */
function switchView(viewId, btn) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
    if (btn) btn.classList.add('active');
}

/* ==========================================================
   SUBIR ARCHIVOS A CLOUDINARY
   ========================================================== */
async function subirACloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    const uploadEndpoint = `https://api.cloudinary.com/v1_1/n4ni5wxl/auto/upload`;

    try {
        const response = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.secure_url) {
            console.log("Subida exitosa:", data.secure_url);
            return data.secure_url;
        } else {
            console.error("Detalle del error de Cloudinary:", data);
            alert(`Error de Cloudinary: ${data.error?.message || 'Archivo no aceptado'}`);
            return null;
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert('Hubo un error de conexión al intentar subir el archivo.');
        return null;
    }
}

/* ==========================================================
   HOBBIES Y CARRUSEL (Formulario Seguro)
   ========================================================== */
const hobbyForm = document.getElementById('hobby-form');
if (hobbyForm) {
    hobbyForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        if (!isAdmin) { alert('No tienes permisos de administrador'); return; }

        const category = document.getElementById('hobby-category').value;
        const title = document.getElementById('hobby-title').value;
        const desc = document.getElementById('hobby-desc').value;
        const mediaInput = document.getElementById('hobby-media');

        let mediaUrl = '';
        let type = 'image';

        if (mediaInput && mediaInput.files && mediaInput.files[0]) {
            const file = mediaInput.files[0];
            type = file.type.startsWith('video') ? 'video' : 'image';
            
            alert('Subiendo archivo a la nube... Por favor, no cierres esta ventana. Los videos pueden tardar unos segundos.');
            
            mediaUrl = await subirACloudinary(file);

            if (!mediaUrl) {
                alert('❌ Operación cancelada: No se pudo subir el archivo multimedia.');
                return; 
            }
        }

        try {
            await db.collection('hobbies').add({
                category,
                title,
                desc,
                media: mediaUrl,
                type,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('✅ ¡Elemento guardado con éxito!');
            hobbyForm.reset();
            cargarHobbiesFirestore();
        } catch (error) {
            console.error("Error al guardar hobby en Firebase:", error);
            alert('Hubo un error al registrar los datos en Firebase.');
        }
    });
}

function cargarHobbiesFirestore() {
    const container = document.getElementById('carousel-container');
    if (!container) return;

    db.collection('hobbies').orderBy('createdAt', 'desc').get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            container.innerHTML = '<p style="color: #94a3b8; padding: 1rem;">No hay elementos en el carrusel.</p>';
            return;
        }

        container.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const h = doc.data();
            const id = doc.id;
            
            const categoryText = h.category ? h.category : 'Hobby';
            const isVideo = h.type === 'video' || (h.media && h.media.match(/\.(mp4|webm|ogg|mov)$/i));

            container.innerHTML += `
                <div class="carousel-item">
                    <span style="font-size: 0.75rem; background: var(--accent); color: #0f172a; padding: 2px 6px; border-radius: 4px; font-weight: bold; display:inline-block; margin-bottom:5px;">${categoryText}</span>
                    <h3 style="margin: 0.5rem 0; color: #fff; font-size: 1rem;">${h.title}</h3>
                    
                    ${h.media ? (isVideo ? 
                        `<video src="${h.media}" controls style="width:100%; height:140px; object-fit:cover; border-radius:6px; margin-bottom:8px; background:#000;"></video>` : 
                        `<img src="${h.media}" alt="${h.title}" style="width:100%; height:140px; object-fit:cover; border-radius:6px; margin-bottom:8px;">`
                    ) : ''}
                    
                    <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-muted);">${h.desc}</p>
                    ${isAdmin ? `<button onclick="deleteHobby('${id}')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 8px; font-size: 0.8rem; width:100%;">Eliminar</button>` : ''}
                </div>
            `;
        });
    });
}

function deleteHobby(id) {
    if (!isAdmin) return;
    if (confirm('¿Estás seguro de eliminar este elemento?')) {
        db.collection('hobbies').doc(id).delete().then(() => {
            alert('Elemento eliminado');
            cargarHobbiesFirestore();
        });
    }
}

/* ==========================================================
   GESTIÓN DE AVATAR
   ========================================================== */
async function updateAvatar(event) {
    if (!isAdmin) return;

    const file = event.target.files[0];
    if (!file) return;

    alert('Subiendo avatar a la nube...');
    const url = await subirACloudinary(file);
    
    if (url) {
        aplicarImagenAvatar(url);
        try {
            await db.collection('portfolio').doc('config').set({ avatar: url }, { merge: true });
            alert('¡Avatar actualizado y guardado en Firebase con éxito!');
        } catch (err) {
            console.error("Error al guardar avatar en Firestore:", err);
            alert('Error al guardar la URL en Firebase.');
        }
    }
}

function aplicarImagenAvatar(src) {
    const wrapper = document.getElementById('avatar-display-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `<img src="${src}" alt="Avatar" class="avatar-img" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
}

/* ==========================================================
   EDICIÓN RÁPIDA DE SECCIONES (Modo Admin)
   ========================================================== */
function toggleEdit(sectionKey) {
    if (!isAdmin) {
        verificarAdmin();
        return;
    }

    const editBox = document.getElementById(`edit-box-${sectionKey}`);
    if (!editBox) return;

    const isOpening = !editBox.classList.contains('active');
    editBox.classList.toggle('active');

    if (isOpening) {
        if (sectionKey === 'profile') {
            const disp = document.getElementById('disp-profile');
            const input = document.getElementById('input-profile');
            if (disp && input) input.value = disp.innerText.trim();
        } else if (sectionKey === 'events') {
            const disp = document.getElementById('disp-events-intro');
            const input = document.getElementById('input-events');
            if (disp && input) input.value = disp.innerText.trim();
        }
    }
}

function saveEdit(section) {
    if (!isAdmin) return;

    let payload = {};

    if (section === 'profile') {
        const val = document.getElementById('input-profile').value;
        payload = { profile: val };
    } 
    else if (section === 'skills') {
        const devVal = document.getElementById('input-skills-dev') ? document.getElementById('input-skills-dev').value : '';
        const infraVal = document.getElementById('input-skills-infra') ? document.getElementById('input-skills-infra').value : '';
        const mgmtVal = document.getElementById('input-skills-mgmt') ? document.getElementById('input-skills-mgmt').value : '';
        
        payload = { 
            skills: {
                dev: devVal,
                infra: infraVal,
                mgmt: mgmtVal
            }
        };
    }
    else if (section === 'events') {
        const val = document.getElementById('input-events').value;
        payload = { events: val };
    }
    else if (section === 'certs') {
        const rawText = document.getElementById('input-certs').value;
        const lines = rawText.split('\n');
        const certsArray = lines.map(line => {
            const parts = line.split('|').map(p => p.trim());
            return {
                curso: parts[0] || "",
                institucion: parts[1] || "",
                fecha: parts[2] || ""
            };
        }).filter(c => c.curso !== "");
        
        payload = { certs: certsArray };
    }
    else if (section === 'contact') {
        payload = {
            contact: {
                srv1: {
                    title: document.getElementById('input-srv1-title').value,
                    desc: document.getElementById('input-srv1-desc').value
                },
                srv2: {
                    title: document.getElementById('input-srv2-title').value,
                    desc: document.getElementById('input-srv2-desc').value
                },
                phone: document.getElementById('input-phone').value,
                wsp: document.getElementById('input-wsp').value,
                fb: document.getElementById('input-fb').value,
                tk: document.getElementById('input-tk').value
            }
        };
    }

    db.collection('portfolio').doc('config').set(payload, { merge: true })
      .then(() => {
          alert("¡Cambios guardados correctamente en la base de datos!");
          toggleEdit(section);
          cargarDatosRemotos();
      })
      .catch((error) => {
          console.error("Error al guardar en Firestore: ", error);
          alert("Hubo un error al guardar los cambios.");
      });
}

/* ==========================================================
   CARGAR DATOS REMOTOS DESDE FIRESTORE
   ========================================================== */
function cargarDatosRemotos() {
    db.collection('portfolio').doc('config').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();

            // Avatar y Perfil
            if (data.avatar) aplicarImagenAvatar(data.avatar);
            if (data.profile) {
                const el = document.getElementById('disp-profile');
                if (el) el.innerText = data.profile;
                const inputProfile = document.getElementById('input-profile');
                if (inputProfile) inputProfile.value = data.profile;
            }

            // Competencias Técnicas
            if (data.skills && typeof data.skills === 'object') {
                if (document.getElementById('input-skills-dev')) document.getElementById('input-skills-dev').value = data.skills.dev || '';
                if (document.getElementById('input-skills-infra')) document.getElementById('input-skills-infra').value = data.skills.infra || '';
                if (document.getElementById('input-skills-mgmt')) document.getElementById('input-skills-mgmt').value = data.skills.mgmt || '';

                const container = document.getElementById('disp-skills-container');
                if (container) {
                    container.innerHTML = `
                        <div class="skill-box">
                            <h3>Desarrollo y Debugging</h3>
                            <ul>${data.skills.dev || ''}</ul>
                        </div>
                        <div class="skill-box">
                            <h3>Infraestructura & Redes</h3>
                            <ul>${data.skills.infra || ''}</ul>
                        </div>
                        <div class="skill-box">
                            <h3>Gestión y E-sports Tech</h3>
                            <ul>${data.skills.mgmt || ''}</ul>
                        </div>
                    `;
                }
            }

            // Eventos / Intro
            if (data.events) {
                const el = document.getElementById('disp-events-intro');
                if (el) el.innerHTML = data.events;
                const inputEvents = document.getElementById('input-events');
                if (inputEvents) inputEvents.value = data.events;
            }

            // Certificaciones
            if (data.certs && Array.isArray(data.certs)) {
                const tbody = document.getElementById('disp-certs');
                if (tbody) {
                    tbody.innerHTML = "";
                    data.certs.forEach(cert => {
                        tbody.innerHTML += `<tr><td><strong>${cert.curso}</strong></td><td>${cert.institucion}</td><td>${cert.fecha}</td></tr>`;
                    });
                }
                const inputCerts = document.getElementById('input-certs');
                if (inputCerts) {
                    inputCerts.value = data.certs.map(c => `${c.curso} | ${c.institucion} | ${c.fecha}`).join('\n');
                }
            }

            // Contacto y Redes Sociales
            if (data.contact) {
                if (data.contact.srv1) {
                    if(document.getElementById('disp-srv1-title')) document.getElementById('disp-srv1-title').innerHTML = `<i class="fa-solid fa-screwdriver-wrench"></i> ${data.contact.srv1.title}`;
                    if(document.getElementById('disp-srv1-desc')) document.getElementById('disp-srv1-desc').innerText = data.contact.srv1.desc;
                    if(document.getElementById('input-srv1-title')) document.getElementById('input-srv1-title').value = data.contact.srv1.title;
                    if(document.getElementById('input-srv1-desc')) document.getElementById('input-srv1-desc').value = data.contact.srv1.desc;
                }
                if (data.contact.srv2) {
                    if(document.getElementById('disp-srv2-title')) document.getElementById('disp-srv2-title').innerHTML = `<i class="fa-solid fa-microchip"></i> ${data.contact.srv2.title}`;
                    if(document.getElementById('disp-srv2-desc')) document.getElementById('disp-srv2-desc').innerText = data.contact.srv2.desc;
                    if(document.getElementById('input-srv2-title')) document.getElementById('input-srv2-title').value = data.contact.srv2.title;
                    if(document.getElementById('input-srv2-desc')) document.getElementById('input-srv2-desc').value = data.contact.srv2.desc;
                }
                if (data.contact.phone) {
                    if(document.getElementById('disp-phone')) document.getElementById('disp-phone').innerText = data.contact.phone;
                    if(document.getElementById('input-phone')) document.getElementById('input-phone').value = data.contact.phone;
                }
                if (data.contact.wsp) {
                    if(document.getElementById('disp-wsp-link')) document.getElementById('disp-wsp-link').href = data.contact.wsp;
                    if(document.getElementById('input-wsp')) document.getElementById('input-wsp').value = data.contact.wsp;
                }
                if (data.contact.fb) {
                    if(document.getElementById('disp-fb-link')) document.getElementById('disp-fb-link').href = data.contact.fb;
                    if(document.getElementById('input-fb')) document.getElementById('input-fb').value = data.contact.fb;
                }
                if (data.contact.tk) {
                    if(document.getElementById('disp-tk-link')) document.getElementById('disp-tk-link').href = data.contact.tk;
                    if(document.getElementById('input-tk')) document.getElementById('input-tk').value = data.contact.tk;
                }
            }
        }
    }).catch((error) => {
        console.warn("Aviso: No se pudo conectar a Firestore.", error);
    });
}

/* ==========================================================
   PROYECTOS PERSONALES
   ========================================================== */
const projectForm = document.getElementById('project-form');
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        if (!isAdmin) { alert('No tienes permisos de administrador'); return; }

        const title = document.getElementById('proj-title').value;
        const desc = document.getElementById('proj-desc').value;
        const link = document.getElementById('proj-link').value;
        const imgInput = document.getElementById('proj-img');

        let imgUrl = '';
        if (imgInput && imgInput.files && imgInput.files[0]) {
            alert('Subiendo imagen del proyecto...');
            imgUrl = await subirACloudinary(imgInput.files[0]);
        }

        try {
            await db.collection('projects').add({
                title,
                desc,
                link,
                img: imgUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('¡Proyecto guardado con éxito en Firebase!');
            projectForm.reset();
            cargarProyectosFirestore();
        } catch (error) {
            console.error("Error al guardar proyecto:", error);
            alert('Hubo un error al registrar el proyecto.');
        }
    });
}

function cargarProyectosFirestore() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    db.collection('projects').orderBy('createdAt', 'desc').get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            container.innerHTML = '<p style="color: #94a3b8; padding: 1rem; grid-column: 1/-1;">No hay proyectos publicados aún.</p>';
            return;
        }

        container.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const p = doc.data();
            const id = doc.id;
            container.innerHTML += `
                <div class="project-card">
                    ${p.img ? `<div class="project-img-container"><img src="${p.img}" alt="${p.title}" class="project-img"></div>` : ''}
                    <div class="project-content">
                        <h3>${p.title}</h3>
                        <p>${p.desc}</p>
                        ${p.link ? `<a href="${p.link}" target="_blank" style="color: var(--accent); text-decoration: underline; font-size: 0.85rem; display:inline-block; margin-bottom:10px;">Ver Enlace</a>` : ''}
                        ${isAdmin ? `<button onclick="deleteProject('${id}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; display: block; width: 100%;">Eliminar</button>` : ''}
                    </div>
                </div>
            `;
        });
    });
}

function deleteProject(id) {
    if (!isAdmin) return;
    if (confirm('¿Estás seguro de eliminar este proyecto de la nube?')) {
        db.collection('projects').doc(id).delete().then(() => {
            alert('Proyecto eliminado');
            cargarProyectosFirestore();
        });
    }
}
