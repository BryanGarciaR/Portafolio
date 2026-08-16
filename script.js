function updateAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatar-display-wrapper').innerHTML = `<img src="${e.target.result}" alt="Avatar" class="avatar-img">`;
        }
        reader.readAsDataURL(file);
    }
}

function switchView(viewId, buttonElement) {
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    buttonElement.classList.add('active');
}

function toggleEdit(sectionKey) {
    const box = document.getElementById(`edit-box-${sectionKey}`);
    box.classList.toggle('active');
    if (box.classList.contains('active')) {
        if (sectionKey === 'profile') {
            document.getElementById('input-profile').value = document.getElementById('disp-profile').innerText;
        } else if (sectionKey === 'events') {
            document.getElementById('input-events').value = document.getElementById('disp-events-intro').innerText;
        } else if (sectionKey === 'contact') {
            document.getElementById('input-srv1-title').value = document.getElementById('disp-srv1-title').innerText.replace(/^\S+\s*/, '');
            document.getElementById('input-srv1-desc').value = document.getElementById('disp-srv1-desc').innerText;
            document.getElementById('input-srv2-title').value = document.getElementById('disp-srv2-title').innerText.replace(/^\S+\s*/, '');
            document.getElementById('input-srv2-desc').value = document.getElementById('disp-srv2-desc').innerText;
            document.getElementById('input-phone').value = document.getElementById('disp-phone').innerText;
            document.getElementById('input-wsp').value = document.getElementById('disp-wsp-link').getAttribute('href');
            document.getElementById('input-fb').value = document.getElementById('disp-fb-link').getAttribute('href');
            document.getElementById('input-tk').value = document.getElementById('disp-tk-link').getAttribute('href');
        }
    }
}

function saveEdit(sectionKey) {
    if (sectionKey === 'profile') {
        document.getElementById('disp-profile').innerText = document.getElementById('input-profile').value;
    } else if (sectionKey === 'events') {
        document.getElementById('disp-events-intro').innerHTML = document.getElementById('input-events').value;
    } else if (sectionKey === 'contact') {
        const srv1Title = document.getElementById('input-srv1-title').value;
        const srv1Desc = document.getElementById('input-srv1-desc').value;
        const srv2Title = document.getElementById('input-srv2-title').value;
        const srv2Desc = document.getElementById('input-srv2-desc').value;
        const phone = document.getElementById('input-phone').value;
        const wsp = document.getElementById('input-wsp').value;
        const fb = document.getElementById('input-fb').value;
        const tk = document.getElementById('input-tk').value;

        document.getElementById('disp-srv1-title').innerHTML = `<i class="fa-solid fa-screwdriver-wrench"></i> ${srv1Title}`;
        document.getElementById('disp-srv1-desc').innerText = srv1Desc;
        document.getElementById('disp-srv2-title').innerHTML = `<i class="fa-solid fa-microchip"></i> ${srv2Title}`;
        document.getElementById('disp-srv2-desc').innerText = srv2Desc;
        document.getElementById('disp-phone').innerText = phone;
        document.getElementById('disp-wsp-link').setAttribute('href', wsp);
        document.getElementById('disp-fb-link').setAttribute('href', fb);
        document.getElementById('disp-tk-link').setAttribute('href', tk);
    }
    toggleEdit(sectionKey);
    alert('¡Modificación guardada con éxito!');
}

document.getElementById('project-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('proj-title').value;
    const desc = document.getElementById('proj-desc').value;
    const link = document.getElementById('proj-link').value.trim();
    const imageInput = document.getElementById('proj-img');

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const container = document.getElementById('projects-container');
            const card = document.createElement('div');
            card.className = 'project-card';
            let linkHTML = link !== '' ? `<a href="${link}" target="_blank" class="project-link" style="color:var(--accent);">Ver Repositorio ➔</a>` : '';
            card.innerHTML = `
                <div class="project-img-container"><img src="${e.target.result}" class="project-img"></div>
                <div class="project-content">
                    <h3>${title}</h3>
                    <p>${desc}</p>
                    ${linkHTML}
                </div>
            `;
            container.prepend(card);
            document.getElementById('project-form').reset();
            alert('¡Proyecto publicado!');
        }
        reader.readAsDataURL(imageInput.files[0]);
    }
});

document.getElementById('hobby-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const cat = document.getElementById('hobby-category').value;
    const title = document.getElementById('hobby-title').value;
    const desc = document.getElementById('hobby-desc').value;
    const mediaInput = document.getElementById('hobby-media');

    if (mediaInput.files && mediaInput.files[0]) {
        const file = mediaInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const container = document.getElementById('carousel-container');
            const item = document.createElement('div');
            item.className = 'carousel-item';
            let mediaHTML = file.type.startsWith('video/') ? `<video src="${e.target.result}" controls style="width:100%; height:140px; object-fit:cover;"></video>` : `<img src="${e.target.result}" style="width:100%; height:140px; object-fit:cover;">`;
            item.innerHTML = `
                <span style="color:var(--accent); font-size:0.75rem; text-transform:uppercase; font-weight:bold;">${cat}</span>
                <div style="margin:10px 0; border-radius:8px; overflow:hidden;">${mediaHTML}</div>
                <h3 style="font-size:1rem; color:#fff; margin-bottom:5px;">${title}</h3>
                <p style="font-size:0.85rem; color:var(--text-muted);">${desc}</p>
            `;
            container.prepend(item);
            document.getElementById('hobby-form').reset();
            alert('¡Multimedia agregada!');
        }
        reader.readAsDataURL(file);
    }
});