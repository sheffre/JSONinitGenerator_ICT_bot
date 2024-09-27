// Загрузка списка регионов из файла regions.json
fetch('./regions.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(regions => {
        const regionSelect = document.getElementById('region-select');
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            option.textContent = `${region.id} ${region.name}`;  // Формат "id Название региона"
            regionSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Ошибка загрузки регионов:', error));

document.getElementById('add-jury').addEventListener('click', function() {
    const juryForm = document.createElement('form');
    juryForm.classList.add('jury-form');

    const lastName = createInput('Фамилия', 'text', true);
    const firstName = createInput('Имя', 'text', true);
    const middleName = createInput('Отчество', 'text', false);

    juryForm.appendChild(lastName);
    juryForm.appendChild(firstName);
    juryForm.appendChild(middleName);

    document.getElementById('jury-forms').appendChild(juryForm);
});

document.getElementById('add-team').addEventListener('click', function() {
    const teamForm = document.createElement('form');
    teamForm.classList.add('team-form');

    const teamName = createInput('Название команды', 'text', true);
    const participantsCount = createInput('Количество участников', 'number', true);

    participantsCount.addEventListener('input', function() {
        const count = parseInt(participantsCount.value) || 0;
        const participantsContainer = teamForm.querySelector('.participants-container') || document.createElement('div');
        participantsContainer.classList.add('participants-container');
        participantsContainer.innerHTML = '';  // Очищаем контейнер

        if (count < 3 || count > 6) {
            alert('Количество участников должно быть не менее 3 и не более 6.');
            return;
        }

        for (let i = 1; i <= count; i++) {
            const participant = document.createElement('div');
            participant.textContent = `Участник ${i}`;
            const lastName = createInput('Фамилия', 'text', true);
            const firstName = createInput('Имя', 'text', true);
            const middleName = createInput('Отчество', 'text', false);
            
            participant.appendChild(lastName);
            participant.appendChild(firstName);
            participant.appendChild(middleName);
            
            participantsContainer.appendChild(participant);
        }

        teamForm.appendChild(participantsContainer);
    });

    teamForm.appendChild(teamName);
    teamForm.appendChild(participantsCount);

    document.getElementById('team-forms').appendChild(teamForm);
});

document.getElementById('generate-file').addEventListener('click', function() {
    const data = {
        region: document.getElementById('region-select').value,  // Добавляем регион в данные
        jury: [],
        teams: []
    };

    let isValid = true;

    // Собираем данные жюри
    document.querySelectorAll('.jury-form').forEach(form => {
        const lastName = form.querySelector('input[placeholder="Фамилия"]').value.trim();
        const firstName = form.querySelector('input[placeholder="Имя"]').value.trim();
        const middleName = form.querySelector('input[placeholder="Отчество"]').value.trim();

        if (!lastName || !firstName) {
            alert('Фамилия и имя жюри обязательны для заполнения!');
            isValid = false;
            return;
        }

        const juryMember = {
            lastName,
            firstName,
            middleName
        };
        data.jury.push(juryMember);
    });

    if (!isValid) return;

    // Собираем данные команд
    document.querySelectorAll('.team-form').forEach(form => {
        const teamName = form.querySelector('input[placeholder="Название команды"]').value.trim();
        const participantsContainer = form.querySelector('.participants-container');
        const participants = [];

        if (!teamName) {
            alert('Название команды обязательно для заполнения!');
            isValid = false;
            return;
        }

        participantsContainer.querySelectorAll('div').forEach(participant => {
            const lastName = participant.querySelector('input[placeholder="Фамилия"]').value.trim();
            const firstName = participant.querySelector('input[placeholder="Имя"]').value.trim();
            const middleName = participant.querySelector('input[placeholder="Отчество"]').value.trim();

            if (!lastName || !firstName) {
                alert('Фамилия и имя участников обязательны для заполнения!');
                isValid = false;
                return;
            }

            participants.push({
                lastName,
                firstName,
                middleName
            });
        });

        if (!isValid) return;

        const team = {
            teamName,
            participants
        };

        data.teams.push(team);
    });

    if (!isValid) return;

    // Создаем и скачиваем JSON-файл
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jury_teams_data.json';
    a.click();
    URL.revokeObjectURL(url);
});

function createInput(placeholder, type = 'text', required = false) {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.required = required;
    return input;
}
