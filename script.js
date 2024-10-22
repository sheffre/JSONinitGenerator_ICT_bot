// Глобальный массив жюри
const jury_dict = [];
const jury_index_map = {};

// Инициализация кнопок
document.getElementById('add-jury-btn').addEventListener('click', addJury);
document.getElementById('add-stage-btn').addEventListener('click', addStage);
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
            option.id = `id ${region.name}`;
            regionSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Ошибка при загрузке регионов:', error));

// Функция для добавления жюри в список (словарь)
function addJury() {
    const juryContainer = document.getElementById('jury-container');
    const juryDiv = document.createElement('div');
    juryDiv.classList.add('jury');
    
    const juryId = Date.now(); // Уникальный идентификатор жюри
    let isJuryFinalized = false; // Флаг для отслеживания, завершён ли ввод жюри

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
        jury_dict.splice(index, 1); // Удаляем жюри из массива
        delete jury_index_map[juryId];
        updateJuryIndexes();  // Обновляем индексы жюри после удаления
        juryDiv.remove();
        updateAllSectionJurySelects();  // Обновление всех секций после удаления
    });

    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            const last_name = inputs[0].value;
            const first_name = inputs[1].value;

            // Проверяем, заполнены ли обязательные поля
            if (last_name && first_name) {
                if (!isJuryFinalized) {
                    // Добавляем нового члена жюри в массив и сохраняем его индекс
                    const jury = {
                        last_name: inputs[0].value,
                        first_name: inputs[1].value,
                        middle_name: inputs[2].value || '',
                        achievements: inputs[3].value || ''
                    };
                    jury_dict.push(jury);
                    jury_index_map[juryId] = jury_dict.length - 1;
                    isJuryFinalized = true; // Отмечаем, что жюри добавлено
                } else {
                    // Обновляем данные существующего жюри
                    const jury = {
                        last_name: inputs[0].value,
                        first_name: inputs[1].value,
                        middle_name: inputs[2].value || '',
                        achievements: inputs[3].value || ''
                    };
                    jury_dict[jury_index_map[juryId]] = jury;
                }
                updateAllSectionJurySelects();  // Обновляем селекторы при изменении жюри
            }
        });
    });
}

// Обновление индексов жюри после удаления
function updateJuryIndexes() {
    Object.keys(jury_index_map).forEach((key, index) => {
        jury_index_map[key] = index;
    });
}

// Функция для добавления этапа
function addStage() {
    const stagesContainer = document.getElementById('stages-container');
    const stageDiv = document.createElement('div');
    stageDiv.classList.add('stage');
    
    const stageId = Date.now(); // Уникальный идентификатор этапа
    
    stageDiv.innerHTML = `
        <h3>Этап</h3>
        <button class="delete-stage-btn">Удалить этап</button>
        <label>Количество секций:</label>
        <input type="number" min="1" class="section-count" required>
        <div class="sections-container"></div>
    `;

    stagesContainer.appendChild(stageDiv);

    // Удаление этапа
    stageDiv.querySelector('.delete-stage-btn').addEventListener('click', () => {
        stageDiv.remove();
    });

    // Добавление секций по числу, указанному в поле
    stageDiv.querySelector('.section-count').addEventListener('input', function () {
        const sectionCount = parseInt(this.value, 10);
        const sectionsContainer = stageDiv.querySelector('.sections-container');
        sectionsContainer.innerHTML = ''; // Очистка старых секций
        for (let i = 0; i < sectionCount; i++) {
            addSection(sectionsContainer);
        }
    });
}

// Функция для добавления секции
function addSection(sectionsContainer) {
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('section');
    
    sectionDiv.innerHTML = `
        <h4>Секция</h4>
        <button class="add-jury-btn">Добавить жюри</button>
        <div class="section-jury-container"></div>
    `;

    sectionsContainer.appendChild(sectionDiv);

    const sectionJuryContainer = sectionDiv.querySelector('.section-jury-container');

    // Логика добавления жюри в секцию
    sectionDiv.querySelector('.add-jury-btn').addEventListener('click', function () {
        const jurySelectDiv = document.createElement('div');
        
        const select = document.createElement('select');
        updateJurySelectOptions(select);  // Обновляем опции селектора на основе текущего списка жюри
        
        const deleteJuryBtn = document.createElement('button');
        deleteJuryBtn.textContent = 'Удалить жюри';
        
        jurySelectDiv.appendChild(select);
        jurySelectDiv.appendChild(deleteJuryBtn);
        
        sectionJuryContainer.appendChild(jurySelectDiv);
        
        deleteJuryBtn.addEventListener('click', () => {
            jurySelectDiv.remove();
        });
    });
}

// Обновление всех выпадающих списков жюри в секциях
function updateAllSectionJurySelects() {
    const allSelects = document.querySelectorAll('.section select');
    allSelects.forEach(select => {
        updateJurySelectOptions(select);
    });
}

// Функция для обновления опций селектора жюри
function updateJurySelectOptions(selectElement) {
    selectElement.innerHTML = ''; // Очищаем предыдущие опции
    jury_dict.forEach((jury, index) => {
        const option = document.createElement('option');
        option.value = index; // Используем индекс в массиве
        option.textContent = `${jury.last_name} ${jury.first_name}`;
        selectElement.appendChild(option);
    });
}

// Генерация итогового JSON
function generateJson() {
    const password = document.getElementById('password').value;
    const tournamentName = document.getElementById('tournament-name').value;
    const region = document.getElementById('region-select').value;

    // Словарь жюри с массивом данных
    const jury = jury_dict.reduce((acc, juryMember) => {
        acc.push({
            last_name: juryMember.last_name,
            first_name: juryMember.first_name,
            middle_name: juryMember.middle_name,
            achievements: juryMember.achievements
        });
        return acc;
    }, []);

    // Собираем данные по этапам и секциям
    const stagesContainer = document.getElementById('stages-container');
    const stages = [...stagesContainer.querySelectorAll('.stage')].map(stageDiv => {
        const sections = [...stageDiv.querySelectorAll('.section')].map(sectionDiv => {
            const sectionJury = [...sectionDiv.querySelectorAll('select')].map(select => {
                return parseInt(select.value, 10);  // Индекс жюри в массиве
            });
            return sectionJury;
        });
        return sections;
    });

    // Генерация JSON с данными
    const jsonContent = JSON.stringify({ tournament_name: tournamentName, region, jury, jury_by_section: stages }, null, 2);
    
    // Формируем текст для .txt-файла
    const txtContent = `/rt ${password} ${jsonContent}`;
    downloadTxt(txtContent, 'init.txt');
}

function downloadTxt(data, filename) {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
