// State management for move tables
export const moveTableStates = {
    levelUp: false,
    tm: false,
    egg: false,
    evolution: false,
    reminder: false
};

// Toggle move table visibility
export function toggleMoveTable(tableType) {
    moveTableStates[tableType] = !moveTableStates[tableType];
    const container = document.getElementById(`${tableType}-table-container`);
    const icon = document.getElementById(`${tableType}-collapse-icon`);
    if (container && icon) {
        container.style.display = moveTableStates[tableType] ? 'none' : 'block';
        icon.textContent = moveTableStates[tableType] ? '▼' : '▲';
    }
}

// Set up moves toggle functionality
export function setupMoveTables() {
    const levelUpBtn = document.getElementById('level-up-btn');
    const tmBtn = document.getElementById('tm-btn');
    const eggBtn = document.getElementById('egg-btn');
    const reminderBtn = document.getElementById('reminder-btn');
    const evolutionBtn = document.getElementById('evolution-btn');
    const levelUpSection = document.getElementById('level-up-section');
    const tmSection = document.getElementById('tm-section');
    const eggSection = document.getElementById('egg-section');
    const reminderSection = document.getElementById('reminder-section');
    const evolutionSection = document.getElementById('evolution-section');

    if (levelUpBtn && tmBtn && eggBtn && reminderBtn && evolutionBtn && levelUpSection && tmSection && eggSection && reminderSection && evolutionSection) {
        // Initial state
        tmSection.style.display = 'none';
        eggSection.style.display = 'none';
        reminderSection.style.display = 'none';
        evolutionSection.style.display = 'none';
        levelUpSection.style.display = 'block';
        levelUpBtn.classList.add('active');
        
        function showSection(activeSection, activeBtn) {
            // Hide all sections and remove active class from all buttons
            [levelUpSection, tmSection, eggSection, reminderSection, evolutionSection].forEach(section => {
                section.style.display = 'none';
            });
            [levelUpBtn, tmBtn, eggBtn, reminderBtn, evolutionBtn].forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show active section and add active class to button
            activeSection.style.display = 'block';
            activeBtn.classList.add('active');

            // Map section ID to state key
            const idToStateKey = {
                'level-up-section': 'levelUp',
                'tm-section': 'tm',
                'egg-section': 'egg',
                'evolution-section': 'evolution',
                'reminder-section': 'reminder'
            };

            // Apply the collapsed state to the active section's table
            const stateKey = idToStateKey[activeSection.id];
            if (stateKey) {
                const tableContainer = document.getElementById(`${stateKey}-table-container`);
                const icon = document.getElementById(`${stateKey}-collapse-icon`);
                if (tableContainer && icon) {
                    tableContainer.style.display = moveTableStates[stateKey] ? 'none' : 'block';
                    icon.textContent = moveTableStates[stateKey] ? '▼' : '▲';
                }
            }
        }

        levelUpBtn.addEventListener('click', () => {
            showSection(levelUpSection, levelUpBtn);
        });

        tmBtn.addEventListener('click', () => {
            showSection(tmSection, tmBtn);
        });

        eggBtn.addEventListener('click', () => {
            showSection(eggSection, eggBtn);
        });

        reminderBtn.addEventListener('click', () => {
            showSection(reminderSection, reminderBtn);
        });

        evolutionBtn.addEventListener('click', () => {
            showSection(evolutionSection, evolutionBtn);
        });
    }
}
