// State
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
const dom = {
    sidebar: document.getElementById('sidebar'),
    slidesContainer: document.getElementById('slides-container'),
    sidebarNav: document.getElementById('sidebar-nav'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    progressBar: document.getElementById('progress-bar'),
    modal: document.getElementById('info-modal'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    modalContentWrapper: document.getElementById('modal-content-wrapper'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    chatPanel: document.getElementById('ai-chat-panel'),
    chatInput: document.getElementById('chat-input'),
    chatHistory: document.getElementById('chat-history')
};
let currentSlideIndex = 0;

// Diagram Data
const diagrams = {
    1: { file: 'diagrama1.png', desc: 'Visão macro das interações entre os atores (Nível Zero)' },
    2: { file: 'diagrama2.png', desc: 'Estrutura do banco de dados e orientação a objetos (Classes)' },
    3: { file: 'diagrama3.png', desc: 'Caminho dos dados no fechamento de pedido (Sequência)' },
    4: { file: 'diagrama4.png', desc: 'Jornada lógica do consumidor dentro do restaurante (Atividades)' }
};

const modalCharts = {
    'Detalhamento de Orçamento (CAPEX e OPEX)': {
        type: 'donut',
        data: [
            { label: 'CAPEX', value: 46530, color: '#2563eb' },
            { label: 'OPEX / mês', value: 450, color: '#f59e0b' }
        ],
        note: 'Comparativo entre investimento de capital e custo mensal recorrente.'
    },
    'Dashboard Gerencial e BI': {
        type: 'bar',
        data: [
            { label: 'Ticket Médio (R$)', value: 28, color: '#2563eb' },
            { label: 'Pedidos/Dia', value: 120, color: '#10b981' },
            { label: 'Satisfação', value: 87, color: '#f59e0b' }
        ],
        note: 'Indicadores de negócios que suportam decisões estratégicas.'
    },
    'Operação & Cozinha (KDS)': {
        type: 'bar',
        data: [
            { label: 'Antes do KDS', value: 12, color: '#ef4444' },
            { label: 'Após o KDS', value: 7, color: '#10b981' }
        ],
        unit: 'minutos',
        note: 'Redução do tempo médio de preparo com o Kitchen Display System.'
    },
    'Sprint Planning': {
        type: 'timeline',
        data: [
            { label: 'Semana 5', value: 1 },
            { label: 'Semana 7', value: 2 },
            { label: 'Semana 9', value: 3 },
            { label: 'Semana 11', value: 4 }
        ],
        note: 'Cronograma simplificado das principais cerimônias de sprint.'
    }
};

// Initialize App
function init() {
    buildSidebar();
    updateUI();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'Enter') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') closeModal();
    });

    let touchStartX = 0;
    let touchEndX = 0;
    dom.slidesContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    dom.slidesContainer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) nextSlide();
        if (touchEndX > touchStartX + 50) prevSlide();
    }, { passive: true });
    initDiagramTabs();
    initDiagramExpandListener();
}

// Build Sidebar Navigation dynamically
function buildSidebar() {
    const fragment = document.createDocumentFragment();
    slides.forEach((slide, index) => {
        const title = slide.getAttribute('data-title');
        const btn = document.createElement('button');
        btn.className = `nav-item w-full text-left px-6 py-3 text-sm text-slate-600 block focus:outline-none ${index === 0 ? 'active' : ''}`;
        btn.id = `nav-${index}`;
        btn.innerHTML = `<span class="opacity-50 mr-2">${index + 1}.</span> ${title}`;
        btn.onclick = () => goToSlide(index);
        fragment.appendChild(btn);
    });
    dom.sidebarNav.appendChild(fragment);
}

function nextSlide() {
    if (currentSlideIndex < totalSlides - 1) goToSlide(currentSlideIndex + 1);
}

function prevSlide() {
    if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1);
}

function goToSlide(index) {
    slides[currentSlideIndex].classList.remove('active');
    slides[currentSlideIndex].classList.add('previous');
    document.getElementById(`nav-${currentSlideIndex}`).classList.remove('active');
    slides.forEach((s, i) => {
        if (i >= index) s.classList.remove('previous');
    });

    currentSlideIndex = index;
    slides[currentSlideIndex].classList.add('active');
    document.getElementById(`nav-${currentSlideIndex}`).classList.add('active');
    if (window.innerWidth < 768) {
        dom.sidebar.classList.add('-translate-x-full');
    }
    updateUI();
}

function updateUI() {
    dom.btnPrev.disabled = currentSlideIndex === 0;
    dom.btnNext.disabled = currentSlideIndex === totalSlides - 1;
    dom.progressBar.style.width = `${((currentSlideIndex + 1) / totalSlides) * 100}%`;
}

function toggleSidebar() {
    dom.sidebar.classList.toggle('-translate-x-full');
}

function openModal(title, contentHTML) {
    dom.modalTitle.textContent = title;
    const chartDefinition = modalCharts[title];
    const chartId = chartDefinition ? `modal-chart-${title.replace(/[^\w]+/g, '-').toLowerCase()}` : null;
    const chartHtml = chartDefinition ? `<div class="chart-block"><div id="${chartId}" class="chart-container"></div>${chartDefinition.note ? `<p class="chart-note">${chartDefinition.note}</p>` : ''}</div>` : '';

    dom.modalBody.innerHTML = `${contentHTML}${chartHtml}`;
    dom.modal.classList.remove('hidden');
    void dom.modal.offsetWidth;
    dom.modalBackdrop.classList.remove('opacity-0');
    dom.modalContentWrapper.classList.remove('scale-95', 'opacity-0');

    if (chartDefinition) renderChart(chartDefinition, chartId);
}

function closeModal() {
    dom.modalBackdrop.classList.add('opacity-0');
    dom.modalContentWrapper.classList.add('scale-95', 'opacity-0');
    setTimeout(() => dom.modal.classList.add('hidden'), 300);
}

function renderChart(definition, chartId) {
    const chartRoot = document.getElementById(chartId);
    if (!chartRoot) return;
    chartRoot.innerHTML = '';

    if (definition.type === 'donut') {
        chartRoot.innerHTML = createDonutChartHtml(definition);
    } else if (definition.type === 'bar') {
        chartRoot.innerHTML = createBarChartHtml(definition);
    } else if (definition.type === 'timeline') {
        chartRoot.innerHTML = createTimelineChartHtml(definition);
    }
}

function createDonutChartHtml(definition) {
    const total = definition.data.reduce((sum, item) => sum + item.value, 0);
    const circumference = 2 * Math.PI * 60;
    let offset = 0;

    const segments = definition.data.map((item) => {
        const dash = (item.value / total) * circumference;
        const element = `<circle cx="90" cy="90" r="60" fill="none" stroke="${item.color}" stroke-width="24" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${offset}" transform="rotate(-90 90 90)" />`;
        offset -= dash;
        return element;
    }).join('');

    const centerLabel = definition.data.find(item => item.label === 'CAPEX') ? 'CAPEX' : 'BI';
    return `
        <div class="chart-donut-wrapper">
            <svg class="chart-donut-svg" viewBox="0 0 180 180" role="img" aria-label="Gráfico donut de comparação">
                ${segments}
            </svg>
            <div class="chart-donut-center"><span>${centerLabel}</span></div>
        </div>
        <div class="chart-legend">${definition.data.map(item => `<div class="chart-legend-item"><span class="chart-legend-swatch" style="background:${item.color}"></span>${item.label}</div>`).join('')}</div>
    `;
}

function createBarChartHtml(definition) {
    const maxValue = Math.max(...definition.data.map(item => item.value));
    return `<div class="chart-grid">${definition.data.map(item => {
        const width = maxValue === 0 ? 0 : (item.value / maxValue) * 100;
        const displayValue = definition.unit ? `${item.value} ${definition.unit}` : item.value;
        return `
            <div class="chart-bar-row">
                <span class="chart-bar-label">${item.label}</span>
                <div class="chart-bar">
                    <div class="chart-bar-fill" style="width:${width}%; background:${item.color};"></div>
                </div>
                <span class="chart-bar-value">${displayValue}</span>
            </div>
        `;
    }).join('')}</div>`;
}

function createTimelineChartHtml(definition) {
    const maxValue = Math.max(...definition.data.map(item => item.value));
    return `<div class="chart-grid chart-timeline">${definition.data.map(item => {
        const width = maxValue === 0 ? 0 : (item.value / maxValue) * 100;
        return `
            <div class="chart-bar-row">
                <span class="chart-bar-label">${item.label}</span>
                <div class="chart-bar chart-bar-timeline">
                    <div class="chart-bar-fill" style="width:${width}%; background:#2563eb;"></div>
                </div>
                <span class="chart-bar-value">Etapa ${item.value}</span>
            </div>
        `;
    }).join('')}</div>`;
}

function changeDiagram(id) {
    const image = document.getElementById('diagram-image');
    const modalImage = document.getElementById('diagram-modal-image');
    const caption = document.getElementById('diagram-caption');
    const tabButtons = document.querySelectorAll('.diagram-tab');
    const diagram = diagrams[id];

    if (!diagram || !image || !caption) return;

    image.src = diagram.file;
    if (modalImage) modalImage.src = diagram.file;
    caption.textContent = diagram.desc;

    tabButtons.forEach((button) => {
        const buttonId = Number(button.dataset.diagram);
        if (buttonId === id) {
            button.classList.add('text-brand-600', 'border-brand-600', 'bg-white');
            button.classList.remove('text-slate-500', 'border-transparent');
        } else {
            button.classList.remove('text-brand-600', 'border-brand-600', 'bg-white');
            button.classList.add('text-slate-500', 'border-transparent');
        }
    });
}

function initDiagramTabs() {
    document.querySelectorAll('.diagram-tab').forEach((button) => {
        button.addEventListener('click', () => {
            const diagramId = Number(button.dataset.diagram);
            changeDiagram(diagramId);
        });
    });

    const captionToggle = document.getElementById('diagram-caption');
    if (captionToggle) {
        captionToggle.addEventListener('click', toggleDiagramExpand);
    }
}

function toggleDiagramExpand() {
    const modal = document.getElementById('diagram-modal');
    const image = document.getElementById('diagram-image');
    const modalImage = document.getElementById('diagram-modal-image');
    
    if (!modal || !image) return;
    
    modalImage.src = image.src;
    modal.classList.remove('hidden');
}

function closeDiagramModal(event) {
    const modal = document.getElementById('diagram-modal');
    if (!modal) return;
    
    // Close if clicking on the overlay background itself (not the content)
    if (event && event.target === modal) {
        modal.classList.add('hidden');
    }
}

function initDiagramExpandListener() {
    const modal = document.getElementById('diagram-modal');
    const viewer = document.getElementById('diagram-viewer');
    
    if (viewer) {
        viewer.addEventListener('click', toggleDiagramExpand);
    }
    
    if (modal) {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeDiagramModal();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }
}

function toggleChat() {
    dom.chatPanel.classList.toggle('hidden-chat');
    if (!dom.chatPanel.classList.contains('hidden-chat')) {
        dom.chatInput.focus();
    }
}

function appendMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex gap-2 ${isUser ? 'justify-end' : ''}`;

    const avatarHtml = isUser
        ? `<div class="w-6 h-6 rounded-full bg-brand-100 flex-shrink-0 flex items-center justify-center text-brand-600 text-xs mt-1 order-2"><i class="fa-solid fa-user"></i></div>`
        : `<div class="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs mt-1"><i class="fa-solid fa-robot"></i></div>`;

    const bubbleHtml = `<div class="${isUser ? 'bg-brand-600 text-white rounded-tr-sm order-1' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'} p-3 rounded-2xl text-sm max-w-[85%] whitespace-pre-wrap">${text}</div>`;
    msgDiv.innerHTML = avatarHtml + bubbleHtml;
    dom.chatHistory.appendChild(msgDiv);
    dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
}

function showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.id = 'typing-indicator';
    indicatorDiv.className = 'flex gap-2';
    indicatorDiv.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs mt-1"><i class="fa-solid fa-robot"></i></div>
        <div class="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center h-10">
            <div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
            <div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
            <div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
        </div>
    `;
    dom.chatHistory.appendChild(indicatorDiv);
    dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

const apiKey = "";
const systemPrompt = `Você é o Assistente Virtual e Especialista Técnico do "Projeto Sinfonia do Sabor", elaborado pelo Grupo 8 (Tamires Dias, Lucas Cunha, Ronaldo Carlos, Thaynan Luiz, Edison Marcos) da faculdade Centro Universitário Augusto Motta. Seu papel é responder perguntas sobre o projeto durante a apresentação de forma amigável, inteligente e executiva.
        
Contexto do Projeto:
- Resumo: Transformação digital de um restaurante, focando em autoatendimento e inteligência de negócios com abordagem híbrida.
- Escopo Principal (MVP): 
  1. PWA e Autoatendimento via QR Code.
  2. KDS (Kitchen Display System) para a cozinha.
  3. Dashboard de BI para o gerente.
- Prazo e Metodologia: 16 semanas totais. Desenvolvimento do PWA usará Scrum (3 Sprints exatas de 2 semanas, Semanas 5 a 11). O Gerente atua como Product Owner.
- Custos (CAPEX): Orçamento base R$ 42.300 + 10% contingência = Total R$ 46.530,00. OPEX de R$ 450/mês.
- Arquitetura: Uso de API Rest com formato JSON e WebSockets para enviar pedidos da API direto para a Cozinha (KDS) em tempo real. Banco de Dados com entidades: Usuario, Mesa, Produto, Pagamento, Pedido, ItemPedido.
- Riscos: Expansão de Escopo, Atraso em Integrações de pagamento e Resistência da equipe do restaurante ao novo sistema.

Regras:
1. Responda APENAS com base nessas informações. Se perguntarem algo fora disso, diga educadamente que o escopo atual do projeto não cobre essa área.
2. Seja conciso (no máximo 1 a 2 parágrafos).`;

async function fetchWithBackoff(payload, retries = 3, delay = 1000) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                await new Promise(res => setTimeout(res, delay));
                return fetchWithBackoff(payload, retries - 1, delay * 2);
            }
            throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return fetchWithBackoff(payload, retries - 1, delay * 2);
        }
        throw error;
    }
}

async function sendMessage() {
    const message = dom.chatInput.value.trim();
    if (!message) return;
    dom.chatInput.value = '';
    appendMessage(message, true);
    showTypingIndicator();

    const payload = {
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    try {
        const result = await fetchWithBackoff(payload);
        removeTypingIndicator();
        if (result.candidates && result.candidates.length > 0) {
            appendMessage(result.candidates[0].content.parts[0].text, false);
        } else {
            appendMessage('Desculpe, tive um problema ao processar a resposta.', false);
        }
    } catch (error) {
        removeTypingIndicator();
        appendMessage('Erro na conexão com a IA. Tente novamente mais tarde.', false);
    }
}

window.addEventListener('DOMContentLoaded', init);
