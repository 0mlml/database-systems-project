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
                if (response.status !== 404) console.error('Error:', response.status);
                const table = document.getElementById('insertQueryTable');
                table.innerHTML = '';
                return;
            }
            return response.text()
        })
        .then((text) => {
            if (!text) return;
            const table = document.getElementById('insertQueryTable');
            table.innerHTML = '';

            const headerRow = document.createElement('tr');
            const headers = text.split(',');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header.trim();
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            const inputRow = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'text';
                input.name = header.trim();
                td.appendChild(input);
                inputRow.appendChild(td);
            });
            table.appendChild(inputRow);
        })
        .catch(err => console.error('Error:', err));
}

function wrapIfNotNumeric(s) {
    return isNaN(s) ? `'${s}'` : s;
}