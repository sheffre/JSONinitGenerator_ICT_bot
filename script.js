document.getElementById('add-jury-btn').addEventListener('click', addJury);
document.getElementById('add-team-btn').addEventListener('click', addTeam);
document.getElementById('generate-json-btn').addEventListener('click', generateJson);

// Загрузка регионов из файла regions.json и добавление в выпадающее меню
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

// Добавление обработчика события для подтверждения обновления страницы
window.addEventListener('beforeunload', function (event) {
    event.preventDefault();
    event.returnValue = 'Вы уверены, что хотите обновить страницу? Внесённые изменения не сохранятся!';
});

function addJury() {
    const juryContainer = document.getElementById('jury-container');
    const juryDiv = document.createElement('div');
    juryDiv.classList.add('jury');
    juryDiv.innerHTML = `
        <input type="text" placeholder="Фамилия" required>
        <input type="text" placeholder="Имя" required>
        <input type="text" placeholder="Отчество">
        <input type="text" placeholder="Регалии">
        <button class="delete-jury-btn">Удалить жюри</button>
    `;
    juryContainer.appendChild(juryDiv);
    
    juryDiv.querySelector('.delete-jury-btn').addEventListener('click', () => {
        juryDiv.remove();
    });
}

function addTeam() {
    const teamsContainer = document.getElementById('teams-container');
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('team');
    
    teamDiv.innerHTML = `
        <input type="text" placeholder="Название команды" required>
        <input type="number" min="1" placeholder="Место в жеребьевке" required class="draw-position">
        <button class="collapse-team-btn">Свернуть</button>
        <div class="members-container"></div>
        <button class="add-member-btn">Добавить участника</button>
        <button class="delete-team-btn">Удалить команду</button>
    `;

    const membersContainer = teamDiv.querySelector('.members-container');
    let memberCount = 3;

    // Автоматически добавляем 3 участника при создании команды
    for (let i = 0; i < 3; i++) {
        addMember(membersContainer);
    }

    teamsContainer.appendChild(teamDiv);

    const addMemberBtn = teamDiv.querySelector('.add-member-btn');
    const collapseTeamBtn = teamDiv.querySelector('.collapse-team-btn');

    // Логика добавления и удаления участников команды
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

    collapseTeamBtn.addEventListener('click', () => {
        membersContainer.classList.toggle('hidden');
        collapseTeamBtn.textContent = membersContainer.classList.contains('hidden') ? 'Развернуть' : 'Свернуть';
    });
    
    function addMember(container) {
        const memberDiv = document.createElement('div');
        memberDiv.classList.add('member');
        memberDiv.innerHTML = `
            <input type="text" placeholder="Фамилия" required>
            <input type="text" placeholder="Имя" required>
            <input type="text" placeholder="Отчество">
            <button class="delete-member-btn">Удалить участника</button>
        `;
        container.appendChild(memberDiv);

        memberDiv.querySelector('.delete-member-btn').addEventListener('click', () => {
            if (memberCount > 3) {
                memberDiv.remove();
                memberCount--;
                addMemberBtn.disabled = false;
            }
        });
    }
}

function generateJson() {
    // Получаем название турнира, количество этапов и регион
    const tournamentName = document.getElementById('tournament-name').value;
    const numberOfStages = parseInt(document.getElementById('number-of-stages').value, 10);
    const region = document.getElementById('region-select').value;

    // Собираем данные о жюри
    const juryContainer = document.getElementById('jury-container');
    const jury = [...juryContainer.querySelectorAll('.jury')].map(juryDiv => ({
        lastName: juryDiv.querySelector('input[placeholder="Фамилия"]').value,
        firstName: juryDiv.querySelector('input[placeholder="Имя"]').value,
        middleName: juryDiv.querySelector('input[placeholder="Отчество"]').value,
        achievements: juryDiv.querySelector('input[placeholder="Регалии"]').value
    }));

    // Собираем данные о командах
    const teamsContainer = document.getElementById('teams-container');
    const teams = [...teamsContainer.querySelectorAll('.team')].map(teamDiv => {
        const teamName = teamDiv.querySelector('input[placeholder="Название команды"]').value;
        const drawPosition = parseInt(teamDiv.querySelector('.draw-position').value, 10);
        
        const members = [...teamDiv.querySelectorAll('.member')].map(memberDiv => ({
            lastName: memberDiv.querySelector('input[placeholder="Фамилия"]').value,
            firstName: memberDiv.querySelector('input[placeholder="Имя"]').value,
            middleName: memberDiv.querySelector('input[placeholder="Отчество"]').value
        }));

        return { teamName, drawPosition, members };
    });

    // Сортируем команды по "Место в жеребьевке"
    teams.sort((a, b) => a.drawPosition - b.drawPosition);

    // Генерация JSON с турниром, количеством этапов, регионом, жюри и командами
    const jsonContent = JSON.stringify({ numberOfStages, region, jury, teams }, null, 2);
    
    // Формируем текст для .txt-файла
    const txtContent = `/rt ${tournamentName} ${jsonContent}`;
    downloadTxt(txtContent, 'tournament_data.txt');
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
