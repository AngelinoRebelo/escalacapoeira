import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Função de substituição para alert/confirm (apenas console log)
function showMessage(message, isError = false) {
    console.log(isError ? `[ERRO] ${message}` : `[INFO] ${message}`);
}

// --- INICIALIZAÇÃO FIREBASE (Versão que funciona com 'schedules') ---
// O código que o usuário diz funcionar usa esta configuração interna
const firebaseConfig = {
    apiKey: "AIzaSyCpJ8VjHmZeJjYFXM-zU3r2KMBM5_nPrfE",
    authDomain: "escalacapoeira-19ed9.firebaseapp.com",
    projectId: "escalacapoeira-19ed9",
    storageBucket: "escalacapoeira-19ed9.firebasestorage.app",
    messagingSenderId: "50984261791",
    appId: "1:50984261791:web:d2b1a147919dc0c19baaaa"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let userId = null;
let schedulesCollection;

// O CAMINHO DE TRABALHO é a coleção simples 'schedules'
const COLLECTION_NAME = 'schedules';

const authReady = new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            schedulesCollection = collection(db, COLLECTION_NAME);
            resolve(true);
        }
    });
});

async function authenticate() {
    try {
        // Usa signInAnonymously como o código de trabalho fornecido
        await signInAnonymously(auth);
    } catch(error) {
        console.error("Anonymous sign-in failed:", error);
    }
}
authenticate();


document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DO DOM ---
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const authBtn = document.getElementById('auth-btn');
    const printBtn = document.getElementById('print-btn');
    const reportBtn = document.getElementById('report-btn'); // Novo botão
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    const saveScheduleBtn = document.getElementById('save-schedule-btn');
    const loginError = document.getElementById('login-error');
    const tabEditor = document.getElementById('tab-editor');
    const tabSaved = document.getElementById('tab-saved');
    const editorView = document.getElementById('editor-view');
    const savedSchedulesView = document.getElementById('saved-schedules-view');
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    const scheduleBody = document.getElementById('schedule-body');
    const textWidthHelper = document.getElementById('text-width-helper');
    const passwordConfirmModal = document.getElementById('password-confirm-modal');
    const cancelPasswordConfirmBtn = document.getElementById('cancel-password-confirm');
    const confirmPasswordActionBtn = document.getElementById('confirm-password-action');
    const confirmPasswordInput = document.getElementById('confirm-password-input');
    const passwordConfirmError = document.getElementById('password-confirm-error');

    // --- ESTADO DA APLICAÇÃO ---
    let isLoggedIn = false;
    let onPasswordConfirm = null;

    // --- CONSTANTES ---
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekNames = ["PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA", "SEXTA"];
    const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const cultos = { 0: "LOUVOR E ADORAÇÃO", 3: "DOUTRINA", 5: "LIBERTAÇÃO" };
    const cultDaysOrder = [3, 5, 0];
    
    // Lista de nomes atualizada (Removidos CALHIU e GABRIELA)
    const originalStaffNames = [
        "A DEFINIR", "MISS. KELLY", "MISS.ANA", "MISS.LORRANE", "MISS.ESTER",
        "DCa.SIMONE", "DCa. RAQUEL", "DCa. ROSA", "OB. CLEMILTON", "OB. MARCOS",
        "OB. JANETE", "OB. ANA ROCHA", "IR. GABRIEL", "IR. VITÓRIA",
        "PR. GABRIEL", "PRB. LEANDRO", "DCa. CRISTIANE" 
    ].sort();
    
    let staffNames = [...originalStaffNames];

    const octoberData = [
        {
            3: { portaria: 'A DEFINIR/OB. CLEMILTON', direcao: 'A DEFINIR', preleitor: 'A DEFINIR', info: '' },
            5: { portaria: 'OB. CLEMILTON/MISS. ESTER', direcao: 'DCa.SIMONE', preleitor: 'DCa.SIMONE', info: '' },
            0: { portaria: 'DCa. RAQUEL/IR. GABRIEL', direcao: 'A DEFINIR', preleitor: 'A DEFINIR', info: '' }
        },
        {
            3: { portaria: 'MISS.LORRANE/IR. VITÓRIA', direcao: 'A DEFINIR', preleitor: 'PR. GABRIEL', info: '' },
            5: { portaria: 'MISS. KELLY/OB. ANA ROCHA', direcao: 'DCa.SIMONE', preleitor: 'A DEFINIR', info: '' },
            0: { portaria: 'A DEFINIR/OB. MARCOS', direcao: 'MISS. KELLY', preleitor: 'PR. GABRIEL', info: '' }
        },
        {
            3: { portaria: 'OB. ANA ROCHA/A DEFINIR', direcao: 'OB. JANETE', preleitor: 'A DEFINIR', info: '' },
            5: { portaria: 'IR. VITÓRIA/OB. CLEMILTON', direcao: 'DCa.SIMONE', preleitor: 'A DEFINIR', info: '' },
            0: { portaria: 'DCa. ROSA/A DEFINIR', direcao: 'MISS.ANA', preleitor: 'A DEFINIR', info: '' }
        },
        {
            3: { portaria: 'MISS.ESTER/OB. CLEMILTON', direcao: 'MISS.LORRANE', preleitor: 'PRB. LEANDRO', info: '' },
            5: { portaria: 'IR. VITÓRIA/IR. GABRIEL', direcao: 'DCa.SIMONE', preleitor: 'A DEFINIR', info: '' },
            0: { portaria: 'OB. MARCOS/MISS. KELLY', direcao: 'PR. GABRIEL', preleitor: 'A DEFINIR', info: '' }
        },
        {
            3: { portaria: 'OB. JANETE/A DEFINIR', direcao: 'MISS.ESTER', preleitor: 'A DEFINIR', info: '' },
            5: { portaria: 'A DEFINIR/IR. VITÓRIA', direcao: 'DCa.SIMONE', preleitor: 'A DEFINIR', info: '' },
            0: { portaria: 'OB. MARCOS/DCa. RAQUEL', direcao: 'PRB. LEANDRO', preleitor: 'A DEFINIR', info: '' }
        }
    ];

    const loginIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
    const logoutIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>`;
    const weekHeaderHTML = `
        <tr class="bg-blue-500 text-white uppercase tracking-wider text-xs sm:text-sm table-header-week">
            <th class="px-2 py-2">Data</th>
            <th class="px-2 py-2">Dia</th>
            <th class="px-2 py-2">Culto</th>
            <th class="px-2 py-2">Portaria</th>
            <th class="px-2 py-2">Direção</th>
            <th class="px-2 py-2">Preleitor</th>
        </tr>`;


    // --- LÓGICA DE AUTENTICAÇÃO E BOTÕES ---
    printBtn.addEventListener('click', () => window.print());
    // NOVO: Botão de Relatório usa a mesma função de impressão
    reportBtn.addEventListener('click', () => window.print());

    const checkAuth = () => {
        isLoggedIn = sessionStorage.getItem('escala_loggedin') === 'true';
        updateAuthUI();
    };

    const updateAuthUI = () => {
        if(isLoggedIn) {
            authBtn.innerHTML = logoutIconSVG;
            authBtn.setAttribute('title', 'Sair');
            authBtn.classList.replace('bg-green-500', 'bg-red-500');
            authBtn.classList.replace('hover:bg-green-600', 'hover:bg-red-600');
            saveScheduleBtn.classList.remove('hidden');
        } else {
            authBtn.innerHTML = loginIconSVG;
            authBtn.setAttribute('title', 'Login para Editar');
            authBtn.classList.replace('bg-red-500', 'bg-green-500');
            authBtn.classList.replace('hover:bg-red-600', 'hover:bg-green-600');
            saveScheduleBtn.classList.add('hidden');
        }
    };
    
    authBtn.addEventListener('click', (e) => {
        if(isLoggedIn) {
            sessionStorage.removeItem('escala_loggedin');
            checkAuth();
            renderSchedule(parseInt(yearInput.value), parseInt(monthSelect.value));
        } else {
            authContainer.classList.remove('hidden');
            authContainer.classList.add('flex');
        }
    });

    cancelLoginBtn.addEventListener('click', () => { authContainer.classList.add('hidden'); authContainer.classList.remove('flex'); });
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        if (document.getElementById('username').value === 'cgcapoeira' && document.getElementById('password').value === '3458') {
            sessionStorage.setItem('escala_loggedin', 'true');
            authContainer.classList.add('hidden');
            authContainer.classList.remove('flex');
            checkAuth();
            renderSchedule(parseInt(yearInput.value), parseInt(monthSelect.value));
        } else {
            loginError.classList.remove('hidden');
        }
    });

    // --- LÓGICA DAS ABAS ---
    tabEditor.addEventListener('click', () => {
        editorView.classList.remove('hidden');
        savedSchedulesView.classList.add('hidden');
        tabEditor.classList.add('tab-active');
        tabSaved.classList.remove('tab-active');
    });

    tabSaved.addEventListener('click', () => {
        savedSchedulesView.classList.remove('hidden');
        editorView.classList.add('hidden');
        tabSaved.classList.add('tab-active');
        tabEditor.classList.remove('tab-active');
        loadSavedSchedules();
    });

    // --- LÓGICA FIREBASE (SALVAR/CARREGAR/DELETAR) ---
    saveScheduleBtn.addEventListener('click', saveScheduleToFirebase);

    async function saveScheduleToFirebase() {
        if (!schedulesCollection) { showMessage("Erro de conexão com o Firebase.", true); return; }
        
        try {
            const month = parseInt(monthSelect.value);
            const year = parseInt(yearInput.value);
            const scheduleId = `${year}-${String(month + 1).padStart(2, '0')}`;
            
            const scheduleData = { month, year, scheduleName: `${months[month]} de ${year}`, weeks: [] };

            scheduleBody.querySelectorAll('tr[data-week-num]').forEach(headerRow => {
                const weekNum = parseInt(headerRow.dataset.weekNum);
                scheduleData.weeks[weekNum] = {
                    weekName: headerRow.querySelector('td').childNodes[0].textContent.trim(),
                    services: []
                };
            });

            scheduleBody.querySelectorAll('tr[data-row-id]').forEach(row => {
                const weekIndex = parseInt(row.dataset.weekIndex);
                const cells = row.querySelectorAll('td');
                
                const portariaSelects = cells[3].querySelectorAll('select');
                const direcaoSelect = cells[4].querySelector('select');
                const preleitorSelect = cells[5].querySelector('select');

                if (!portariaSelects || portariaSelects.length < 2 || !direcaoSelect || !preleitorSelect) {
                    throw new Error("Não foi possível encontrar todos os campos de seleção em uma linha da tabela.");
                }
                
                const portariaValue = `${portariaSelects[0].value} / ${portariaSelects[1].value}`;

                const service = {
                    date: cells[0].querySelector('input').value,
                    day: cells[1].textContent,
                    type: cells[2].querySelector('[data-type]').textContent,
                    info: cells[2].querySelector('[data-info-display]').textContent,
                    portaria: portariaValue,
                    direcao: direcaoSelect.value,
                    preleitor: preleitorSelect.value
                };
                
                if (scheduleData.weeks[weekIndex]) {
                    scheduleData.weeks[weekIndex].services.push(service);
                }
            });
            
            scheduleData.weeks = scheduleData.weeks.filter(Boolean);
            
            await setDoc(doc(schedulesCollection, scheduleId), scheduleData);
            showMessage(`Escala para ${scheduleData.scheduleName} salva com sucesso!`);
            tabSaved.click();
        } catch (error) { 
            console.error("Erro ao salvar:", error); 
            showMessage("Erro ao salvar a escala. Detalhes: " + error.message, true); 
        }
    }
    
    async function loadSavedSchedules() {
        const listContainer = document.getElementById('saved-schedules-list');
        listContainer.innerHTML = '<p class="text-gray-500">Carregando...</p>';
        try {
            await authReady; // Garante que o firebase está pronto
            const querySnapshot = await getDocs(schedulesCollection);
            if (querySnapshot.empty) { listContainer.innerHTML = '<p class="text-gray-500">Nenhuma escala salva.</p>'; return; }
            listContainer.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const schedule = doc.data();
                const el = document.createElement('div');
                el.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg border';
                
                const deleteButtonHtml = isLoggedIn ? `<button data-id="${doc.id}" class="delete-btn bg-red-500 text-white p-2 rounded-full hover:bg-red-600 text-sm"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>` : '';

                el.innerHTML = `
                    <span class="font-medium text-gray-800">${schedule.scheduleName}</span>
                    <div class="flex gap-2">
                        <button data-id="${doc.id}" class="load-btn bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm">Carregar</button>
                        ${deleteButtonHtml}
                    </div>`;
                listContainer.appendChild(el);
            });
            listContainer.querySelectorAll('.load-btn').forEach(b => b.addEventListener('click', (e) => loadSpecificSchedule(e.target.dataset.id)));
            if (isLoggedIn) {
                listContainer.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', (e) => deleteSchedule(e.currentTarget.dataset.id)));
            }
        } catch (error) { console.error("Erro ao carregar:", error); listContainer.innerHTML = '<p class="text-red-500">Erro ao carregar.</p>'; }
    }

    async function loadSpecificSchedule(docId) {
        try {
            const docSnap = await getDoc(doc(schedulesCollection, docId));
            if (docSnap.exists()) {
                const data = docSnap.data();
                monthSelect.value = data.month;
                yearInput.value = data.year;
                renderSchedule(data.year, data.month, data);
                tabEditor.click();
            } else { showMessage("Escala não encontrada.", true); }
        } catch (error) { console.error("Erro ao carregar:", error); showMessage("Erro ao carregar a escala.", true); }
    }

    async function deleteSchedule(docId) {
        const performDeletion = async () => {
            
            // Simulamos a confirmação exigindo a senha:
            confirmPasswordActionBtn.dataset.docId = docId;
            requestPasswordConfirmation(async () => {
                try {
                    await deleteDoc(doc(schedulesCollection, docId));
                    showMessage("Escala excluída com sucesso.");
                    loadSavedSchedules();
                } catch (error) {
                    console.error("Erro ao excluir:", error);
                    showMessage("Erro ao excluir a escala.", true);
                }
            });
        };
        performDeletion();
    }
    
    // --- LÓGICA DOS MODAIS E AUTO-AJUSTE ---
    function autoSizeSelect(element) {
        if (!element) return;
        const selectedOption = element.options[element.selectedIndex];
        textWidthHelper.style.font = window.getComputedStyle(element).font;
        textWidthHelper.textContent = selectedOption.text;
        element.style.width = `${textWidthHelper.scrollWidth + 10}px`;
    }

    function requestPasswordConfirmation(callback) {
        onPasswordConfirm = callback;
        confirmPasswordInput.value = '';
        passwordConfirmError.classList.add('hidden');
        passwordConfirmModal.style.display = 'flex';
    }
    
    function onEditInfoClick(e) {
        const btn = e.currentTarget;
        const infoDisplay = btn.closest('td').querySelector('[data-info-display]');
        if (!infoDisplay) return;
        
        const currentText = infoDisplay.textContent;
        // Mantendo o prompt para captura de dados, já que o prompt não é alert/confirm.
        const newInfo = prompt("Adicionar/Editar Informação:", currentText); 
        
        if (newInfo !== null) { // User clicked OK
            infoDisplay.textContent = newInfo.trim();
        }
    }

    const addCultoModal = document.getElementById('add-culto-modal');
    const removeCultoModal = document.getElementById('remove-culto-modal');
    let currentWeekForModal = null;
    function setupModalEvents() {
        document.getElementById('cancel-add-culto').addEventListener('click', () => { addCultoModal.style.display = 'none'; });
        document.getElementById('cancel-remove-culto').addEventListener('click', () => { removeCultoModal.style.display = 'none'; });
        document.getElementById('confirm-remove-culto').addEventListener('click', () => {
            const performRemoval = () => {
                removeCultoModal.querySelectorAll('input:checked').forEach(cb => {
                    const row = scheduleBody.querySelector(`tr[data-row-id="${cb.value}"]`);
                    if (row) row.remove();
                });
                showMessage("Culto(s) removido(s) com sucesso.");
                removeCultoModal.style.display = 'none';
            };

            if (removeCultoModal.querySelectorAll('input:checked').length > 0) {
                requestPasswordConfirmation(performRemoval);
            } else {
                removeCultoModal.style.display = 'none';
            }
        });
        document.getElementById('confirm-add-culto').addEventListener('click', () => {
            const newDate = document.getElementById('new-culto-date').value;
            if (!newDate) { showMessage("Por favor, selecione uma data.", true); return; }

            const dateObj = new Date(newDate + 'T00:00:00');
            const serviceData = {
                date: newDate,
                day: dayNames[dateObj.getDay()].toUpperCase(),
                type: document.getElementById('new-culto-type').value,
                info: '',
                portaria: 'A DEFINIR', direcao: 'A DEFINIR', preleitor: 'A DEFINIR'
            };
            
            const disabledState = isLoggedIn ? '' : 'disabled';
            const newRow = createServiceRow(currentWeekForModal, serviceData, disabledState);
            let lastRowInWeek = scheduleBody.querySelector(`tr[data-week-num="${currentWeekForModal}"]`);
            scheduleBody.querySelectorAll(`tr[data-week-index="${currentWeekForModal}"]`).forEach(r => lastRowInWeek = r);
            lastRowInWeek.insertAdjacentElement('afterend', newRow);

            newRow.querySelectorAll('select.auto-size-select').forEach(select => {
                autoSizeSelect(select);
                select.addEventListener('change', () => autoSizeSelect(select));
            });
            newRow.querySelector('.edit-info-btn').addEventListener('click', onEditInfoClick);
            
            addCultoModal.style.display = 'none';
            showMessage(`Culto de ${serviceData.type} adicionado!`);
        });
    }

    // Continuação e fecho do document.addEventListener
    cancelPasswordConfirmBtn.addEventListener('click', () => {
        passwordConfirmModal.style.display = 'none';
        onPasswordConfirm = null;
    });
    
    confirmPasswordActionBtn.addEventListener('click', () => {
        if (confirmPasswordInput.value === '3458') {
            if (typeof onPasswordConfirm === 'function') {
                onPasswordConfirm();
            }
            passwordConfirmModal.style.display = 'none';
            onPasswordConfirm = null;
        } else {
            passwordConfirmError.classList.remove('hidden');
            confirmPasswordInput.value = '';
            showMessage("Senha incorreta.", true);
        }
    });

    // --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ---
    function createServiceRow(weekIndex, service, disabledState) {
        const rowId = `row-${Date.now()}-${Math.random()}`;
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.dataset.rowId = rowId;
        row.dataset.weekIndex = weekIndex;

        const createSelectForRole = (names, selectedValue, classes = '', role = '') => {
            let optionsHtml = '';
            const nameSet = new Set(names);
            if (selectedValue && !nameSet.has(selectedValue)) {
                nameSet.add(selectedValue);
            }
            const sortedNames = [...nameSet].sort();

            for (const name of sortedNames) {
                optionsHtml += `<option value="${name}" ${name === selectedValue ? 'selected' : ''}>${name}</option>`;
            }

            if (role === 'preleitor') {
                optionsHtml += `<option value="__outro__" class="italic text-blue-600">+ Cadastrar preleitor...</option>`;
                optionsHtml += `<option value="__deletar__" class="italic text-red-600">- Deletar preleitor...</option>`;
            }

            return `<select data-role="${role}" class="p-1 border-0 rounded w-full text-center auto-size-select ${classes}" ${disabledState}>${optionsHtml}</select>`;
        };
        
        const portariaParts = service.portaria.includes('/') 
            ? service.portaria.split('/').map(s => s.trim()) 
            : [service.portaria.trim(), 'A DEFINIR'];
        
        row.innerHTML = `
            <td class="px-2 py-1"><input type="date" class="p-1 border-0 rounded w-full date-input" value="${service.date}" data-row-id="${rowId}" ${disabledState}></td>
            <td id="day-cell-${rowId}" class="px-2 py-1">${service.day}</td>
            <td class="px-2 py-1 font-semibold text-blue-700 relative group">
                <div data-type>${service.type}</div>
                <div data-info-display class="text-xs text-gray-500 italic">${service.info || ''}</div>
                <button class="edit-info-btn absolute top-1 right-1 p-0.5 bg-blue-100 rounded-full text-blue-600 opacity-0 group-hover:opacity-100 ${disabledState === 'disabled' ? 'hidden' : ''}" title="Adicionar/Editar Informação">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
            </td>
            <td class="px-1 py-1 portaria-cell">
                ${createSelectForRole(staffNames, portariaParts[0], '', 'portaria')}
                ${createSelectForRole(staffNames, portariaParts[1], '', 'portaria')}
            </td>
            <td class="px-1 py-1">${createSelectForRole(staffNames, service.direcao, '', 'direcao')}</td>
            <td class="px-1 py-1">${createSelectForRole(staffNames, service.preleitor, 'font-semibold', 'preleitor')}</td>`;
        return row;
    }

    function renderSchedule(year, month, scheduleData = null) {
        scheduleBody.innerHTML = '';
        const disabledState = isLoggedIn ? '' : 'disabled';
        
        const createWeekHeader = (weekIndex, weekNameText) => {
            const row = document.createElement('tr');
            row.dataset.weekNum = weekIndex;
            row.innerHTML = `<td colspan="6" class="bg-blue-200 text-blue-800 font-bold p-2 text-center relative">
                ${weekNameText}
                <div class="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    <button class="remove-week-culto-btn bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700" data-week-num="${weekIndex}" ${disabledState}>-</button>
                    <button class="add-culto-btn bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-700" data-week-num="${weekIndex}" ${disabledState}>+</button>
                </div></td>`;
            
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = weekHeaderHTML;
            
            scheduleBody.appendChild(row);
            scheduleBody.appendChild(headerRow);
        };
        
        if (scheduleData && scheduleData.weeks) {
            staffNames = [...originalStaffNames]; // Reset staff names for rendering saved data
            // Processa nomes salvos e adiciona à lista
            scheduleData.weeks.forEach((week, weekIndex) => {
                createWeekHeader(weekIndex, week.weekName);
                if(week.services) {
                    // Garante que todos os nomes salvos estejam na lista staffNames
                    week.services.forEach(service => {
                        const namesToCheck = [service.direcao, service.preleitor, ...service.portaria.split('/').map(s => s.trim())];
                        namesToCheck.forEach(name => {
                            if(name && name !== 'A DEFINIR' && !staffNames.includes(name)) {
                                staffNames.push(name);
                            }
                        });
                    });
                    // Renderiza as linhas de serviço salvas
                    staffNames.sort(); // Reordena a lista de nomes
                    week.services.forEach(service => scheduleBody.appendChild(createServiceRow(weekIndex, service, disabledState)));
                }
            });
        } else {
            const firstDay = new Date(year, month, 1);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfWeek = firstDay.getDay();

            for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
                const weekRows = [];
                cultDaysOrder.forEach(dayOfWeek => {
                    const firstDateOfWeek = 1 + (dayOfWeek - firstDayOfWeek + 7) % 7;
                    const day = firstDateOfWeek + (weekIndex * 7);

                    if (day > 0 && day <= daysInMonth) {
                        const date = new Date(year, month, day);
                        let type = cultos[dayOfWeek];
                        if (dayOfWeek === 0 && weekIndex === 1) type = "SANTA CEIA";
                        if (dayOfWeek === 0 && weekIndex === 2) type = "CULTO DE MISSÕES";
                        
                        let serviceData = {
                            date: date.toISOString().split('T')[0],
                            day: dayNames[dayOfWeek].toUpperCase(), type,
                            info: '',
                            portaria: 'A DEFINIR', direcao: 'A DEFINIR', preleitor: 'A DEFINIR'
                        };
                        
                        if (month === 9 && octoberData[weekIndex] && octoberData[weekIndex][dayOfWeek]) {
                            const data = octoberData[weekIndex][dayOfWeek];
                            serviceData.portaria = data.portaria;
                            serviceData.direcao = data.direcao;
                            serviceData.preleitor = data.preleitor;
                        }

                        weekRows.push(createServiceRow(weekIndex, serviceData, disabledState));
                    }
                });
                if (weekRows.length > 0) {
                    const name = `${weekNames[weekIndex]} SEMANA DE ${months[month].toUpperCase()}`;
                    createWeekHeader(weekIndex, name);
                    weekRows.forEach(row => scheduleBody.appendChild(row));
                }
            }
        }
        
        // --- ADICIONAR EVENT LISTENERS DINÂMICOS ---
        document.querySelectorAll('.date-input').forEach(i => i.addEventListener('change', (e) => {
            const cell = document.getElementById(`day-cell-${e.target.dataset.rowId}`);
            const date = new Date(e.target.value + 'T00:00:00');
            cell.textContent = dayNames[date.getDay()].toUpperCase();
        }));
        document.querySelectorAll('.add-culto-btn').forEach(b => b.addEventListener('click', (e) => {
            currentWeekForModal = e.currentTarget.dataset.weekNum;
            addCultoModal.style.display = 'flex';
        }));
        document.querySelectorAll('.remove-week-culto-btn').forEach(b => b.addEventListener('click', (e) => {
            currentWeekForModal = e.currentTarget.dataset.weekNum;
            const list = document.getElementById('remove-culto-list');
            list.innerHTML = '';
            scheduleBody.querySelectorAll(`tr[data-week-index="${currentWeekForModal}"]`).forEach(row => {
                const cells = row.querySelectorAll('td');
                list.innerHTML += `<label class="flex items-center gap-2"><input type="checkbox" value="${row.dataset.rowId}">${cells[2].querySelector('[data-type]').textContent} (${cells[0].querySelector('input').value})</label>`;
            });
            if (list.innerHTML === '') {
                list.innerHTML = '<p class="text-gray-500">Nenhum culto para remover nesta semana.</p>';
            }
            removeCultoModal.style.display = 'flex';
        }));
        
        document.querySelectorAll('select.auto-size-select').forEach(select => {
            autoSizeSelect(select);
            select.addEventListener('change', () => autoSizeSelect(select));
        });

        document.querySelectorAll('.edit-info-btn').forEach(btn => {
            btn.addEventListener('click', onEditInfoClick);
        });
        
        document.querySelectorAll('select[data-role="preleitor"]').forEach(select => {
            select.addEventListener('focus', () => {
                select.dataset.previousValue = select.value;
            });
            select.addEventListener('change', (e) => {
                const currentSelect = e.target;
                if (currentSelect.value === '__outro__') {
                    // Mantendo o prompt para captura rápida de texto.
                    const newName = prompt("Digite o nome do novo preleitor:");

                    if (newName && newName.trim() !== '') {
                        const trimmedName = newName.trim();
                        if (!staffNames.includes(trimmedName)) {
                            staffNames.push(trimmedName);
                            staffNames.sort();
                            
                            document.querySelectorAll('select').forEach(s => {
                                if (s.dataset.role === 'preleitor' || s.dataset.role === 'portaria' || s.dataset.role === 'direcao') {
                                    const newOption = new Option(trimmedName, trimmedName);
                                    if (s.querySelector('option[value="__outro__"]')) {
                                        s.add(newOption, s.options[s.options.length - 2]); // Antes de "Adicionar" e "Deletar"
                                    } else {
                                        s.add(newOption);
                                        // Re-sort options se não for preleitor
                                        if (s.dataset.role !== 'preleitor') {
                                            Array.from(s.options)
                                                .sort((a, b) => a.text.localeCompare(b.text))
                                                .forEach(option => s.add(option));
                                        }
                                    }
                                }
                            });
                        }
                        currentSelect.value = trimmedName;
                        autoSizeSelect(currentSelect);
                    } else {
                        currentSelect.value = currentSelect.dataset.previousValue || 'A DEFINIR';
                        autoSizeSelect(currentSelect);
                    }
                } else if (currentSelect.value === '__deletar__') {
                    // Mantendo o prompt para captura rápida de texto.
                    const nameToDelete = prompt("Digite o nome EXATO do preleitor que deseja deletar:");
                    
                    if (!nameToDelete || nameToDelete.trim() === '') {
                        currentSelect.value = currentSelect.dataset.previousValue || 'A DEFINIR';
                        autoSizeSelect(currentSelect);
                        return;
                    }
                    
                    const trimmedName = nameToDelete.trim();
                    
                    if (trimmedName === 'A DEFINIR') {
                        showMessage("Você não pode deletar a opção 'A DEFINIR'.", true);
                        currentSelect.value = currentSelect.dataset.previousValue || 'A DEFINIR';
                        autoSizeSelect(currentSelect);
                        return;
                    }
                    
                    if (originalStaffNames.includes(trimmedName)) {
                        showMessage("Você não pode deletar um nome da lista original.", true);
                        currentSelect.value = currentSelect.dataset.previousValue || 'A DEFINIR';
                        autoSizeSelect(currentSelect);
                        return;
                    }
                    
                    const index = staffNames.indexOf(trimmedName);
                    if (index > -1) {
                        staffNames.splice(index, 1); // Remove from master list
                        
                        document.querySelectorAll('select[data-role="portaria"], select[data-role="direcao"], select[data-role="preleitor"]').forEach(s => {
                            const optionToRemove = s.querySelector(`option[value="${trimmedName}"]`);
                            if (optionToRemove) {
                                s.remove(optionToRemove.index);
                            }
                        });
                        
                        showMessage(`"${trimmedName}" foi removido com sucesso.`);
                        currentSelect.value = 'A DEFINIR';
                        autoSizeSelect(currentSelect);
                    } else {
                        showMessage(`Nome "${trimmedName}" não encontrado na lista de nomes cadastrados.`, true);
                        currentSelect.value = currentSelect.dataset.previousValue || 'A DEFINIR';
                        autoSizeSelect(currentSelect);
                    }
                }
            });
        });
    }

    // --- INICIALIZAÇÃO DA PÁGINA ---
    async function initialize() {
        checkAuth();
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        months.forEach((m, i) => monthSelect.innerHTML += `<option value="${i}">${m}</option>`);
        monthSelect.value = currentMonth;
        yearInput.value = currentYear;
        
        await authReady; // Espera a autenticação do Firebase
        
        const scheduleId = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        let savedData = null;

        if (schedulesCollection) {
            try {
                const docRef = doc(schedulesCollection, scheduleId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    savedData = docSnap.data();
                }
            } catch (error) {
                console.error("Erro ao carregar escala do mês atual:", error);
            }
        }

        renderSchedule(currentYear, currentMonth, savedData); 
        setupModalEvents();
        
        const update = async () => {
            const newYear = parseInt(yearInput.value);
            const newMonth = parseInt(monthSelect.value);
            const scheduleId = `${newYear}-${String(newMonth + 1).padStart(2, '0')}`;
            let savedData = null;

            if (schedulesCollection) {
                try {
                    const docRef = doc(schedulesCollection, scheduleId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        savedData = docSnap.data();
                    }
                } catch (error) {
                    console.error("Erro ao carregar escala selecionada:", error);
                }
            }
            renderSchedule(newYear, newMonth, savedData);
        };
        
        monthSelect.addEventListener('change', update);
        yearInput.addEventListener('change', update);
    }

    initialize();
});
