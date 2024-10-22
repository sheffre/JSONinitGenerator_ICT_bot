// Глобальные массивы для жюри и команд
const jury_dict = [];
const jury_index_map = {};
const used_jury_per_stage = {}; // Отслеживает жюри, использованных в каждом этапе

document.getElementById('add-jury-btn').addEventListener('click', addJury);
document.getElementById('add-stage-btn').addEventListener('click', addStage);
document.getElementById('add-team-btn').addEventListener('click', addTeam);
document.getElementById('generate-json-btn').addEventListener('click', generateJson);

// Загрузка регионов из файла regions.json
fetch('regions.json')
    .then(response => response.json())
    .then(data => {
        const regionSelect = document.getElementById('region-select');
        data.forEach(region => {
            const option = document.createElement('option');
            option.value = region.name;
            option.textContent = region.name;
            regionSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Ошибка при загрузке регионов:', error));

// Функция для обновления индексов жюри после удаления
function updateJuryIndexes() {
    jury_dict.forEach((jury, index) => {
        Object.keys(jury_index_map).forEach(key => {
            if (jury_index_map[key] === index) {
                jury_index_map[key] = index;
            }
        });
    });
}

// Добавление жюри
function addJury() {
    const juryContainer = document.getElementById('jury-container');
    const juryDiv = document.createElement('div');
    juryDiv.classList.add('jury');
    
    const juryId = Date.now();
    let isJuryFinalized = false;

    juryDiv.innerHTML = `
        <input type="text" placeholder="Фамилия" required>
        <input type="text" placeholder="Имя" required>
        <input type="text" placeholder="Отчество">
        <input type="text" placeholder="Регалии">
        <button class="delete-jury-btn">Удалить жюри</button>
    `;
    
    juryContainer.appendChild(juryDiv);

    const inputs = juryDiv.querySelectorAll('input');

    juryDiv.querySelector('.delete-jury-btn').addEventListener('click', () => {
        const index = jury_index_map[juryId];
        jury_dict.splice(index, 1); 
        delete jury_index_map[juryId];
        updateJuryIndexes();  
        juryDiv.remove();
        updateAllSectionJurySelects();
    });

    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            const last_name = inputs[0].value;
            const first_name = inputs[1].value;

            if (last_name && first_name) {
                if (!isJuryFinalized) {
                    const jury = {
                        last_name: inputs[0].value,
                        first_name: inputs[1].value,
                        middle_name: inputs[2].value || '',
                        achievements: inputs[3].value || ''
                    };
                    jury_dict.push(jury);
                    jury_index_map[juryId] = jury_dict.length - 1;
                    isJuryFinalized = true;
                } else {
                    const jury = {
                        last_name: inputs[0].value,
                        first_name: inputs[1].value,
                        middle_name: inputs[2].value || '',
                        achievements: inputs[3].value || ''
                    };
                    jury_dict[jury_index_map[juryId]] = jury;
                }
                updateAllSectionJurySelects();
            }
        });
    });
}

// Добавление этапа
function addStage() {
    const stagesContainer = document.getElementById('stages-container');
    const stageDiv = document.createElement('div');
    stageDiv.classList.add('stage');
    
    const stageId = Date.now();

    // Инициализируем список использованных жюри для этого этапа
    used_jury_per_stage[stageId] = {};

    stageDiv.innerHTML = `
        <h3>Этап</h3>
        <button class="delete-stage-btn">Удалить этап</button>
        <label>Количество секций:</label>
        <input type="number" min="1" class="section-count" required>
        <div class="sections-container"></div>
    `;

    stagesContainer.appendChild(stageDiv);

    stageDiv.querySelector('.delete-stage-btn').addEventListener('click', () => {
        delete used_jury_per_stage[stageId]; // Удаляем список жюри для этого этапа
        stageDiv.remove();
    });

    stageDiv.querySelector('.section-count').addEventListener('input', function () {
        const sectionCount = parseInt(this.value, 10);
        const sectionsContainer = stageDiv.querySelector('.sections-container');
        sectionsContainer.innerHTML = ''; 
        for (let i = 0; i < sectionCount; i++) {
            addSection(sectionsContainer, stageId);
        }
    });
}

// Добавление секции
function addSection(sectionsContainer, stageId) {
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('section');

    sectionDiv.innerHTML = `
        <h4>Секция</h4>
        <button class="add-jury-btn">Добавить жюри</button>
        <div class="section-jury-container"></div>
    `;

    sectionsContainer.appendChild(sectionDiv);

    const sectionJuryContainer = sectionDiv.querySelector('.section-jury-container');

    sectionDiv.querySelector('.add-jury-btn').addEventListener('click', function () {
        const jurySelectDiv = document.createElement('div');
        const select = document.createElement('select');
        updateJurySelectOptions(select, stageId);  
        
        const deleteJuryBtn = document.createElement('button');
        deleteJuryBtn.textContent = 'Удалить жюри';
        
        jurySelectDiv.appendChild(select);
        jurySelectDiv.appendChild(deleteJuryBtn);
        sectionJuryContainer.appendChild(jurySelectDiv);

        // Обработчик выбора жюри
        select.addEventListener('change', () => {
            const selectedValue = select.value;

            // Добавляем жюри в использованные для данного этапа
            used_jury_per_stage[stageId][selectedValue] = true;

            // Обновляем все селекторы на этапе, чтобы исключить выбранное жюри
            updateAllSectionJurySelectsInStage(stageId);
        });

        // Обработчик удаления жюри
        deleteJuryBtn.addEventListener('click', () => {
            const selectedValue = select.value;
            delete used_jury_per_stage[stageId][selectedValue]; // Удаляем из списка занятых
            jurySelectDiv.remove();
            updateAllSectionJurySelectsInStage(stageId); // Обновляем селекторы на этапе
        });
    });
}

// Обновление всех выпадающих списков жюри в одном этапе
function updateAllSectionJurySelectsInStage(stageId) {
    const sections = document.querySelectorAll('.stage');
    sections.forEach(stageDiv => {
        const selects = stageDiv.querySelectorAll('.section select');
        selects.forEach(select => {
            updateJurySelectOptions(select, stageId);
        });
    });
}

// Обновление опций выбора жюри
function updateJurySelectOptions(selectElement, stageId) {
    const currentSelectedValue = selectElement.value; // Храним текущее значение
    selectElement.innerHTML = ''; // Очищаем список перед обновлением

    jury_dict.forEach((jury, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${jury.last_name} ${jury.first_name}`;
        
        // Проверяем, используется ли это жюри в этом этапе
        if (used_jury_per_stage[stageId][index]) {
            option.disabled = true; // Запрещаем выбор уже добавленного жюри в этом этапе
        }

        selectElement.appendChild(option);
    });

    // Восстанавливаем текущее выбранное значение, если оно было выбрано до обновления
    if (currentSelectedValue) {
        selectElement.value = currentSelectedValue;
    }
}

// Добавление команды
function addTeam() {
    const teamsContainer = document.getElementById('teams-container');
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('team');
    
    teamDiv.innerHTML = `
        <input type="text" placeholder="Название команды" required>
        <input type="number" min="1" placeholder="Место в жеребьевке" required class="draw-position">
        <button class="delete-team-btn">Удалить команду</button>
        <div class="members-container"></div>
        <button class="add-member-btn">Добавить участника</button>
    `;

    const membersContainer = teamDiv.querySelector('.members-container');
    let memberCount = 3;

    // Автоматически добавляем 3 участника при создании команды
    for (let i = 0; i < 3; i++) {
        addMember(membersContainer, memberCount);
    }

    teamsContainer.appendChild(teamDiv);

    const addMemberBtn = teamDiv.querySelector('.add-member-btn');

    addMemberBtn.addEventListener('click', () => {
        if (memberCount < 6) {
            addMember(membersContainer);
            memberCount++;
        }
        if (memberCount === 6) {
            addMemberBtn.disabled = true;
        }
    });

    teamDiv.querySelector('.delete-team-btn').addEventListener('click', () => {
        teamDiv.remove();
    });
}

function addMember(container) {
    const memberDiv = document.createElement('div');
    memberDiv.classList.add('member');
    memberDiv.style.display = "flex";

    memberDiv.innerHTML = `
        <input type="text" placeholder="Фамилия" required style="margin-right: 10px;">
        <input type="text" placeholder="Имя" required style="margin-right: 10px;">
        <input type="text" placeholder="Отчество" style="margin-right: 10px;">
        <button class="delete-member-btn">Удалить участника</button>
    `;
    
    container.appendChild(memberDiv);

    const deleteMemberBtn = memberDiv.querySelector('.delete-member-btn');

    deleteMemberBtn.addEventListener('click', () => {
        const membersContainer = container;
        const currentMemberCount = membersContainer.querySelectorAll('.member').length;
        if (currentMemberCount > 3) {
            memberDiv.remove();
        } else {
            alert("Нельзя уменьшить количество участников ниже трёх.");
        }
    });
}

// Генерация итогового JSON
function generateJson() {
    const password = document.getElementById('password').value;
    const tournamentName = document.getElementById('tournament-name').value;
    const region = document.getElementById('region-select').value;

    const jury = jury_dict;
    const stagesContainer = document.getElementById('stages-container');
    const stages = [...stagesContainer.querySelectorAll('.stage')].map(stageDiv => {
        const sections = [...stageDiv.querySelectorAll('.section')].map(sectionDiv => {
            const sectionJury = [...sectionDiv.querySelectorAll('select')].map(select => {
                return parseInt(select.value, 10);
            });
            return sectionJury;
        });
        return sections;
    });

    const teamsContainer = document.getElementById('teams-container');
    const teams = [...teamsContainer.querySelectorAll('.team')].map(teamDiv => {
        const teamName = teamDiv.querySelector('input[placeholder="Название команды"]').value;
        const drawPosition = parseInt(teamDiv.querySelector('.draw-position').value, 10);
        const members = [...teamDiv.querySelectorAll('.member')].map(memberDiv => ({
            last_name: memberDiv.querySelector('input[placeholder="Фамилия"]').value,
            first_name: memberDiv.querySelector('input[placeholder="Имя"]').value,
            middle_name: memberDiv.querySelector('input[placeholder="Отчество"]').value
        }));

        return { team_name: teamName, draw_position: drawPosition, members };
    });

    const jsonContent = JSON.stringify({ tournament_name: tournamentName, region, jury, stages, teams }, null, 2);
    downloadTxt(jsonContent, 'tournament_data.json');
}

function downloadTxt(data, filename) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
