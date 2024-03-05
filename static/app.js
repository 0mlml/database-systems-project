let tableHeadersTimeout = null;
document.getElementById('tableName').addEventListener('keypress', function (e) {
    clearTimeout(tableHeadersTimeout);
    tableHeadersTimeout = setTimeout(fetchTableHeaders, 500);
});

function executeQuery(query) {
    fetch('/submitQuery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    })
        .then(response => response.text())
        .then(text => document.getElementById('result').value = text)
        .catch(err => console.error('Error:', err));
}

function fetchTableHeaders() {
    const tableName = document.getElementById('tableName').value;

    fetch('/fetchTableHeaders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName })
    })
    .then(response => {
        if (response.status !== 200) {
            console.error('Error:', response.status);
            const tableGrid = document.getElementById('insertQueryTable');
            tableGrid.innerHTML = '';
            return;
        }
        return response.text();
    })
    .then((text) => {
        if (!text) return;
        const tableGrid = document.getElementById('insertQueryTable');
        tableGrid.innerHTML = ''; 
        tableGrid.className = 'table-grid'; 

        const headers = text.split(',');
        headers.forEach(header => {
            // Create a single div container for each header
            const divContainer = document.createElement('div');
            divContainer.className = 'grid-item'; 

            // Create and append the header text
            const headerText = document.createElement('div');
            headerText.textContent = header.trim();
            headerText.className = 'table-header';
            divContainer.appendChild(headerText);

           
            const hr = document.createElement('hr');
            divContainer.appendChild(hr);

            // Create and append the input field
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.name = header.trim();
            inputField.className = 'table-input'; 
            divContainer.appendChild(inputField);

           
            tableGrid.appendChild(divContainer);
        });
    })
    .catch(err => console.error('Error:', err));
}




function wrapIfNotNumeric(s) {
    return isNaN(s) ? `'${s}'` : s;
}

function InsertExecuteQuery() {
    const tableName = document.querySelector('#tableName').value;
    const values = Array.from(document.querySelectorAll('.table-input'))
        .map(input => wrapIfNotNumeric(input.value))
        .join(', ');

    const query = `INSERT INTO ${tableName} VALUES (${values})`;
    executeQuery(query); 
}